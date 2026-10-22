const { fetchPlaces } = require("#services/main/geoapifyClientServer.js");
const { createHttpError } = require("#utils/httpError.js");

const CACHE_TTL_MS = 10 * 60 * 1000;
const PLACE_CATEGORIES = [
	"service.police",
	"healthcare.hospital",
	"healthcare.clinic_or_praxis",
	"service.social_facility",
	"service.social_facility.shelter",
];
const cache = new Map();
const pendingRequests = new Map();

const getCacheKey = (latitude, longitude) =>
	`${latitude.toFixed(2)},${longitude.toFixed(2)}`;

const classifyPlace = (properties) => {
	const categories = Array.isArray(properties.categories)
		? properties.categories
		: [];
	const raw = properties.datasource?.raw || {};
	const name = (properties.name || properties.address_line1 || "").toLowerCase();
	const shelterCategories = categories.some((category) =>
		category.toLowerCase().includes("shelter"),
	);
	const shelterTags = [
		raw.social_facility,
		raw.amenity,
		raw.shelter,
		raw["shelter_type"],
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	if (
		shelterCategories ||
		/shelter|homeless|refuge/.test(shelterTags) ||
		/shelter|refuge|women.?s (?:home|shelter)/.test(name)
	) {
		return "shelter";
	}
	if (
		categories.includes("service.police") ||
		raw.amenity === "police" ||
		name.includes("police") ||
		name.includes("saps")
	) {
		return "police";
	}
	if (
		categories.includes("healthcare.clinic_or_praxis.psychiatry") ||
		raw.healthcare === "psychologist" ||
		raw.healthcare === "psychotherapist" ||
		/(psycholog|psychotherap|psychiatr|counsell?or|counseling|therapy|mental health)/i.test(
			name,
		)
	) {
		return "psychologist";
	}
	if (
		categories.includes("healthcare.hospital") ||
		categories.includes("healthcare.clinic_or_praxis") ||
		raw.amenity === "hospital" ||
		raw.amenity === "clinic" ||
		raw.healthcare === "hospital" ||
		raw.healthcare === "clinic" ||
		/(hospital|clinic|health centre|trauma centre)/i.test(name)
	) {
		return "trauma";
	}
	if (categories.includes("service.social_facility")) return "psychologist";
	return null;
};

const normalizePlace = (feature) => {
	const properties = feature?.properties || {};
	const coordinates = feature?.geometry?.coordinates;
	const latitude = Number(properties.lat ?? coordinates?.[1]);
	const longitude = Number(properties.lon ?? coordinates?.[0]);
	const category = classifyPlace(properties);
	if (
		!category ||
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude)
	) {
		return null;
	}

	const raw = properties.datasource?.raw || {};
	const name =
		properties.name ||
		properties.address_line1 ||
		"Local Support Facility";
	return {
		id: String(
			properties.place_id || `${latitude},${longitude}:${name}`,
		),
		category,
		name,
		lat: latitude,
		lon: longitude,
		address: properties.formatted || properties.address_line2 || name,
		phone:
			raw.phone ||
			raw["contact:phone"] ||
			raw.mobile ||
			"Contact via office",
		hours: raw.opening_hours || "Open standard hours / 24 Hours",
		about:
			raw.description ||
			`Geoapify location (${category === "trauma" ? "healthcare" : category})`,
	};
};

const getFeatureId = (feature) => {
	const properties = feature?.properties || {};
	return (
		properties.place_id ||
		`${feature?.geometry?.coordinates?.join(",")}:${properties.name || ""}`
	);
};

const mergeUniqueFeatures = (...groups) => {
	const featuresById = new Map();

	for (const feature of groups.flat()) {
		featuresById.set(String(getFeatureId(feature)), feature);
	}

	return [...featuresById.values()];
};

const getNearbyServices = async (latitude, longitude) => {
	const apiKey = process.env.GEOAPIFY_API_KEY;
	if (!apiKey) throw createHttpError("Geoapify API key is not configured.", 503);

	const key = getCacheKey(latitude, longitude);
	const cached = cache.get(key);
	if (cached && cached.expiresAt > Date.now()) return cached.services;

	const pending = pendingRequests.get(key);
	if (pending) return pending;

	// Reuse concurrent requests for the same area to avoid duplicate provider calls.
	const request = (async () => {
		try {
			const lookups = [
				{ categories: PLACE_CATEGORIES },
				{ categories: ["service.social_facility.shelter"] },
				{
					categories: ["service.social_facility", "accommodation"],
					name: "shelter",
				},
			].map(({ categories, name }) =>
				fetchPlaces(latitude, longitude, apiKey, categories, name),
			);
			const [placesResult, sheltersResult, namedSheltersResult] =
				await Promise.allSettled(lookups);
			const successfulLookups = [
				placesResult,
				sheltersResult,
				namedSheltersResult,
			].filter((result) => result.status === "fulfilled");
			if (successfulLookups.length === 0) {
				throw (
					placesResult.reason ||
					sheltersResult.reason ||
					namedSheltersResult.reason
				);
			}
			if (placesResult.status === "rejected") {
				console.warn(
					"[Nearby services] The combined place lookup failed; using successful supplemental results.",
					placesResult.reason,
				);
			}
			const primaryFeatures =
				placesResult.status === "fulfilled" ? placesResult.value : [];
			const shelterFeatures =
				sheltersResult.status === "fulfilled" ? sheltersResult.value : [];
			const namedShelterFeatures =
				namedSheltersResult.status === "fulfilled"
					? namedSheltersResult.value
					: [];
			if (
				sheltersResult.status === "rejected" ||
				namedSheltersResult.status === "rejected"
			) {
				console.warn(
					"[Nearby services] A supplemental shelter lookup failed:",
					[
						sheltersResult.status === "rejected" &&
							sheltersResult.reason.message,
						namedSheltersResult.status === "rejected" &&
							namedSheltersResult.reason.message,
					]
						.filter(Boolean)
						.join("; "),
				);
			}
			const uniqueFeatures = mergeUniqueFeatures(
				primaryFeatures,
				...shelterFeatures,
				...namedShelterFeatures,
			);
			const services = uniqueFeatures
				.map(normalizePlace)
				.filter(Boolean);
			cache.set(key, {
				services,
				expiresAt: Date.now() + CACHE_TTL_MS,
			});
			return services;
		} catch (error) {
			console.error("[Nearby services] Geoapify Places lookup failed:", error);
			throw createHttpError(
				"Nearby support services are temporarily unavailable.",
				503,
			);
		}
	})();

	pendingRequests.set(key, request);
	try {
		return await request;
	} finally {
		pendingRequests.delete(key);
	}
};

module.exports = { getNearbyServices };
