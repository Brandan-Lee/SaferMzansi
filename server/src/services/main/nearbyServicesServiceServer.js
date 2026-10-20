const CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_RADIUS_METRES = 20000;
const GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places";
const REQUEST_TIMEOUT_MS = 12000;
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

const getNearbyServices = async (latitude, longitude) => {
	if (!process.env.GEOAPIFY_API_KEY) {
		throw Object.assign(new Error("Geoapify API key is not configured."), {
			status: 503,
		});
	}

	const key = getCacheKey(latitude, longitude);
	const cached = cache.get(key);
	if (cached && cached.expiresAt > Date.now()) return cached.services;

	const pending = pendingRequests.get(key);
	if (pending) return pending;

	const request = (async () => {
		const fetchPlaces = async (categories, name) => {
			const url = new URL(GEOAPIFY_PLACES_URL);
			const params = new URLSearchParams({
				categories: categories.join(","),
				filter: `circle:${longitude},${latitude},${SEARCH_RADIUS_METRES}`,
				bias: `proximity:${longitude},${latitude}`,
				limit: "500",
				lang: "en",
			});
			if (name) params.set("name", name);
			url.search = params.toString();
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				REQUEST_TIMEOUT_MS,
			);

			try {
				const response = await fetch(url, {
					headers: { "x-api-key": process.env.GEOAPIFY_API_KEY },
					signal: controller.signal,
				});
				if (!response.ok) {
					const detail = (await response.text()).slice(0, 300);
					throw Object.assign(
						new Error(
							`Geoapify Places request failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
						),
						{ status: response.status },
					);
				}

				const data = await response.json();
				return Array.isArray(data.features) ? data.features : [];
			} finally {
				clearTimeout(timeoutId);
			}
		};

		try {
			const [placesResult, sheltersResult, namedSheltersResult] =
				await Promise.allSettled([
					fetchPlaces(PLACE_CATEGORIES),
					fetchPlaces(["service.social_facility.shelter"]),
					fetchPlaces(
						["service.social_facility", "accommodation"],
						"shelter",
					),
				]);
			if (placesResult.status === "rejected") throw placesResult.reason;
			const features = placesResult.value;
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
			const uniqueFeatures = new Map();
			for (const feature of [
				...features,
				...shelterFeatures,
				...namedShelterFeatures,
			]) {
				const properties = feature?.properties || {};
				const id =
					properties.place_id ||
					`${feature?.geometry?.coordinates?.join(",")}:${properties.name || ""}`;
				uniqueFeatures.set(String(id), feature);
			}
			const services = Array.from(uniqueFeatures.values())
				.map(normalizePlace)
				.filter(Boolean);
			cache.set(key, {
				services,
				expiresAt: Date.now() + CACHE_TTL_MS,
			});
			return services;
		} catch (error) {
			console.error("[Nearby services] Geoapify Places lookup failed:", error);
			throw error;
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
