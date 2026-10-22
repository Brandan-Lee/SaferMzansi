const PLACES_URL = "https://api.geoapify.com/v2/places";
const SEARCH_RADIUS_METRES = 20000;
const REQUEST_TIMEOUT_MS = 7000;

const fetchPlaces = async (latitude, longitude, apiKey, categories, name) => {
	const url = new URL(PLACES_URL);
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
			headers: { "x-api-key": apiKey },
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

module.exports = { fetchPlaces };
