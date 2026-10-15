import { calculateDistanceKm } from "@utils/location/geoUtils";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchNominatimServices = async (latitude, longitude) => {
	if (!latitude || !longitude) {
		console.log("[Nominatim] Waiting for valid local coordinates...");
		return [];
	}

	console.log(
		`[Nominatim] Fetching fresh services for coordinates: Lat ${latitude}, Lon ${longitude}`,
	);

	const queries = [
		"police station",
		"hospital",
		"clinic",
		"shelter",
		"psychologist",
		"counselling",
		"mental health",
		"health centre",
	];

	try {
		const resultsArray = [];

		for (const query of queries) {
			const offset = 0.5;
			const viewbox = `${longitude - offset},${latitude + offset},${longitude + offset},${latitude - offset}`;
			const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&lat=${latitude}&lon=${longitude}&viewbox=${viewbox}&bounded=0&countrycodes=za&limit=10&addressdetails=1&extratags=1`;

			try {
				const response = await fetch(url, {
					headers: {
						"User-Agent": "SaferMzansiApp/1.0 (Student Project)",
						"Accept-Language": "en",
					},
				});

				if (response.ok) {
					const data = await response.json();
					resultsArray.push(data);
				}
			} catch (fetchErr) {
				console.error(
					`[Nominatim] Network error for query [${query}]:`,
					fetchErr,
				);
			}

			await delay(1000);
		}

		const flattened = resultsArray.flat();
		const uniqueMap = new Map();
		flattened.forEach((item) => {
			if (item && item.place_id && !uniqueMap.has(item.place_id)) {
				uniqueMap.set(item.place_id, item);
			}
		});

		const uniqueItems = Array.from(uniqueMap.values());

		const mappedResults = uniqueItems.map((item) => {
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
				id: item.place_id ? item.place_id.toString() : Math.random().toString(),
				category: mapNominatimCategory(item),
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

		const categoryBuckets = {};
		const limitedResults = [];

		validWithinRadius.forEach((place) => {
			const cat = place.category || "trauma";
			if (!categoryBuckets[cat]) categoryBuckets[cat] = 0;
			if (categoryBuckets[cat] < 5) {
				categoryBuckets[cat]++;
				limitedResults.push(place);
			}
		});

		console.log(
			`[Nominatim] Successfully fetched and processed ${limitedResults.length} places.`,
		);
		return limitedResults;
	} catch (err) {
		console.error("[Nominatim] Fetch error encountered:", err);
		return [];
	}
};

const mapNominatimCategory = (item = {}) => {
	const type = (item.type || "").toLowerCase();
	const name = (item.display_name || "").toLowerCase();
	const amenity = (item.amenity || "").toLowerCase();

	if (type === "police" || name.includes("police") || name.includes("saps"))
		return "police";
	if (type === "shelter" || name.includes("shelter")) return "shelter";

	if (
		type === "psychologist" ||
		amenity === "psychologist" ||
		name.includes("psychologist") ||
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
		name.includes("clinic") ||
		name.includes("hospital") ||
		name.includes("health centre")
	) {
		return "trauma";
	}

	return "trauma";
};
