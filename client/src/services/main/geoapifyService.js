import {
	calculateDistanceKm,
	isValidCoordinate,
} from "@utils/location/geoUtils";
import { API_BASE_URL } from "@config/config";

const REQUEST_TIMEOUT_MS = 9000;

export const fetchNearestPoliceStation = async (latitude, longitude) => {
	if (!isValidCoordinate({ latitude, longitude })) {
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
		if (!Array.isArray(results)) {
			throw new Error("Nominatim returned an invalid police lookup response.");
		}
	} finally {
		clearTimeout(timeoutId);
	}

	const nearest = results
		.map((item) => {
			if (!item || typeof item !== "object") return null;
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
	if (!isValidCoordinate({ latitude, longitude })) {
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
			.map((item) => {
				if (!item || typeof item !== "object") return null;
				const placeLatitude = Number(item.lat);
				const placeLongitude = Number(item.lon);
				if (
					!item.id ||
					typeof item.category !== "string" ||
					!isValidCoordinate({
						latitude: placeLatitude,
						longitude: placeLongitude,
					})
				) {
					return null;
				}

				const placeObj = {
					id: item.id,
					category: item.category,
					name: item.name || "Local Support Facility",
					latitude: placeLatitude,
					longitude: placeLongitude,
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
			})
			.filter(Boolean);

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
