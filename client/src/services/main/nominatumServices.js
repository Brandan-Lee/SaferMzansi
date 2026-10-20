import { calculateDistanceKm } from "@utils/location/geoUtils";
import { API_BASE_URL } from "@config/config";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchNearestPoliceStation = async (latitude, longitude) => {
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		console.warn("[Nominatim] Skipping police lookup for invalid coordinates.");
		return null;
	}

	const offset = 0.5;
	const viewbox = `${longitude - offset},${latitude + offset},${longitude + offset},${latitude - offset}`;
	const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent("police station")}&lat=${latitude}&lon=${longitude}&viewbox=${viewbox}&bounded=1&countrycodes=za&limit=50&addressdetails=1`;
	const response = await fetch(url, {
		headers: {
			"User-Agent": "SaferMzansiApp/1.0 (Student Project)",
			"Accept-Language": "en",
		},
	});

	if (!response.ok) {
		throw new Error(`Nominatim police lookup failed with ${response.status}.`);
	}

	const results = await response.json();
	const nearest = (Array.isArray(results) ? results : [])
		.map((item) => {
			const stationLatitude = Number(item.lat);
			const stationLongitude = Number(item.lon);
			if (
				!Number.isFinite(stationLatitude) ||
				!Number.isFinite(stationLongitude)
			) {
				return null;
			}

			const type = (item.type || "").toLowerCase();
			const name = (item.display_name || "").toLowerCase();
			if (
				type !== "police" &&
				!name.includes("police") &&
				!name.includes("saps")
			) {
				return null;
			}

			return {
				name: item.display_name,
				lat: stationLatitude,
				lon: stationLongitude,
				distance: calculateDistanceKm(
					{ latitude, longitude },
					{ latitude: stationLatitude, longitude: stationLongitude },
				),
			};
		})
		.filter((station) => station && station.distance <= 20)
		.sort((a, b) => a.distance - b.distance)[0];

	if (!nearest) return null;

	console.log(
		`[Nominatim] Nearest police station is ${nearest.distance.toFixed(2)} km away.`,
	);
	return { name: nearest.name, lat: nearest.lat, lon: nearest.lon };
};

export const fetchNominatimServices = async (latitude, longitude) => {
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		console.log("[Nominatim] Waiting for valid local coordinates...");
		return [];
	}

	console.log(
		`[Nominatim] Fetching fresh services for coordinates: Lat ${latitude}, Lon ${longitude}`,
	);

	try {
		if (!API_BASE_URL) throw new Error("The API server URL is not configured.");
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 65000);
		let response;
		try {
			response = await fetch(
				`${API_BASE_URL}/locations/nearby-services`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ latitude, longitude }),
					signal: controller.signal,
				},
			);
		} finally {
			clearTimeout(timeoutId);
		}
		if (!response.ok) {
			const errorBody = await response.json().catch(() => null);
			throw new Error(
				errorBody?.error ||
					`Nearby services lookup failed with HTTP ${response.status}.`,
			);
		}
		const data = await response.json();
		const uniqueResults = new Map();
		for (const item of Array.isArray(data?.data?.services) ? data.data.services : []) {
			const location =
				item.lat != null && item.lon != null
					? { latitude: Number(item.lat), longitude: Number(item.lon) }
					: item.center
						? {
								latitude: Number(item.center.lat),
								longitude: Number(item.center.lon),
							}
						: null;
			if (
				!location ||
				!Number.isFinite(location.latitude) ||
				!Number.isFinite(location.longitude)
			)
				continue;
			const tags = item.tags || {};
			const displayName =
				tags.name ||
				tags.official_name ||
				tags.amenity ||
				tags.healthcare ||
				tags.social_facility ||
				"Local Support Facility";
			const resultCategory = classifyNominatimCategory({
				type: item.type,
				display_name: displayName,
				extratags: tags,
				amenity: tags.amenity,
			});
			if (!resultCategory) continue;

			const resultId = `${item.type || ""}:${item.id || ""}`;
			if (!item.id || uniqueResults.has(resultId)) continue;
			uniqueResults.set(resultId, {
				place_id: resultId,
				resultCategory,
				display_name: displayName,
				lat: String(location.latitude),
				lon: String(location.longitude),
				extratags: tags,
			});
		}

		const mappedResults = Array.from(uniqueResults.values()).map((item) => {
			const tags = item.extratags || {};
			const hours = tags.opening_hours || "Open standard hours / 24 Hours";
			const phone =
				tags.phone ||
				tags["contact:phone"] ||
				tags["contact:mobile"] ||
				"Contact via office";
			const description =
				tags.description ||
				tags.note ||
				`OSM Verified Location (${item.type || item.category})`;

			const placeObj = {
				id: String(item.place_id || `${item.osm_type}:${item.osm_id}`),
				category: item.resultCategory,
				name: item.display_name
					? item.display_name.split(",")[0]
					: "Local Support Facility",
				latitude: parseFloat(item.lat),
				longitude: parseFloat(item.lon),
				address: item.display_name || "Address details on map",
				hours,
				phone,
				about: description,
				isSample: false,
			};

			placeObj.distance = calculateDistanceKm(
				{ latitude, longitude },
				{ latitude: placeObj.latitude, longitude: placeObj.longitude },
			);

			return placeObj;
		});

		const validWithinRadius = mappedResults
			.filter((place) => place.distance <= 20)
			.sort((a, b) => a.distance - b.distance);

		const categoryBuckets = new Map();
		const limitedResults = validWithinRadius.filter((place) => {
			const count = categoryBuckets.get(place.category) || 0;
			if (count >= 5) return false;
			categoryBuckets.set(place.category, count + 1);
			return true;
		});

		console.log(
			`[Nominatim] Successfully fetched and processed ${limitedResults.length} places.`,
		);
		return limitedResults;
	} catch (err) {
		console.error("[Nearby services] Fetch error encountered:", err);
		throw err;
	}
};

const classifyNominatimCategory = (item = {}) => {
	const type = (item.type || "").toLowerCase();
	const name = (item.display_name || "").toLowerCase();
	const tags = item.extratags || {};
	const amenity = (tags.amenity || item.amenity || "").toLowerCase();
	const healthcare = (tags.healthcare || "").toLowerCase();
	const socialFacility = (tags.social_facility || "").toLowerCase();

	if (
		type === "police" ||
		amenity === "police" ||
		name.includes("police") ||
		name.includes("saps")
	)
		return "police";
	if (
		type === "shelter" ||
		amenity === "shelter" ||
		socialFacility === "shelter" ||
		name.includes("shelter")
	)
		return "shelter";

	if (
		type === "psychologist" ||
		type === "psychotherapist" ||
		type === "psychiatrist" ||
		amenity === "psychologist" ||
		healthcare === "psychologist" ||
		healthcare === "psychotherapist" ||
		healthcare === "psychiatrist" ||
		name.includes("psychologist") ||
		name.includes("psychotherapist") ||
		name.includes("psychiatrist") ||
		name.includes("psychotherapy") ||
		name.includes("counsellor") ||
		name.includes("counselor") ||
		name.includes("counselling") ||
		name.includes("counseling") ||
		name.includes("therapy") ||
		name.includes("mental health") ||
		name.includes("psychiatry") ||
		name.includes("wellness") ||
		name.includes("social work")
	) {
		return "psychologist";
	}

	if (
		name.includes("community health") ||
		name.includes("social") ||
		amenity === "social_facility"
	) {
		return "psychologist";
	}

	if (
		type === "hospital" ||
		type === "clinic" ||
		type === "doctors" ||
		amenity === "hospital" ||
		amenity === "clinic" ||
		amenity === "doctors" ||
		healthcare === "hospital" ||
		healthcare === "clinic" ||
		healthcare === "doctor" ||
		healthcare === "centre" ||
		name.includes("clinic") ||
		name.includes("hospital") ||
		name.includes("health centre") ||
		name.includes("trauma centre")
	) {
		return "trauma";
	}

	return null;
};
