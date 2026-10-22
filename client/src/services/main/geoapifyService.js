import { calculateDistanceKm } from "@utils/location/geoUtils";
import { API_BASE_URL } from "@config/config";

const REQUEST_TIMEOUT_MS = 4000;

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
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	let response;
	let results;
	try {
		response = await fetch(url, {
			headers: {
				"User-Agent": "SaferMzansiApp/1.0 (Student Project)",
				"Accept-Language": "en",
			},
			signal: controller.signal,
		});
		if (!response.ok) {
			throw new Error(`Nominatim police lookup failed with ${response.status}.`);
		}
		results = await response.json();
	} finally {
		clearTimeout(timeoutId);
	}

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

	return { name: nearest.name, lat: nearest.lat, lon: nearest.lon };
};

export const fetchGeoapifyServices = async (latitude, longitude) => {
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		return [];
	}

	try {
		if (!API_BASE_URL) throw new Error("The API server URL is not configured.");
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			REQUEST_TIMEOUT_MS,
		);
		let response;
		let data;
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
			if (!response.ok) {
				const errorBody = await response.json().catch(() => null);
				throw new Error(
					errorBody?.error ||
						`Nearby services lookup failed with HTTP ${response.status}.`,
				);
			}
			data = await response.json();
		} finally {
			clearTimeout(timeoutId);
		}
		const mappedResults = (
			Array.isArray(data?.data?.services) ? data.data.services : []
		)
			.filter(
				(item) =>
					item.id &&
					typeof item.category === "string" &&
					Number.isFinite(item.lat) &&
					Number.isFinite(item.lon),
			)
			.map((item) => {
				const placeObj = {
					id: item.id,
					category: item.category,
					name: item.name || "Local Support Facility",
					latitude: item.lat,
					longitude: item.lon,
					address: item.address || "Address details on map",
					hours: item.hours || "Open standard hours / 24 Hours",
					phone: item.phone || "Contact via office",
					about: item.about || "Nearby support service",
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

		return limitedResults;
	} catch (err) {
		console.error("[Geoapify] Fetch error encountered:", err);
		throw err;
	}
};
