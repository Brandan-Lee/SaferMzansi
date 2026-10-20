const CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_RADIUS_METRES = 20000;
const OVERPASS_URLS = [
	"https://overpass-api.de/api/interpreter",
	"https://overpass.kumi.systems/api/interpreter",
];
const MAX_ATTEMPTS_PER_PROVIDER = 2;
const REQUEST_TIMEOUT_MS = 10000;
const cache = new Map();
const pendingRequests = new Map();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCacheKey = (latitude, longitude) =>
	`${latitude.toFixed(2)},${longitude.toFixed(2)}`;

const buildOverpassQuery = (latitude, longitude) => `
[out:json][timeout:15];
(
  nwr(around:${SEARCH_RADIUS_METRES},${latitude},${longitude})["amenity"~"^(police|hospital|clinic|doctors|psychologist|shelter)$"];
  nwr(around:${SEARCH_RADIUS_METRES},${latitude},${longitude})["healthcare"~"^(hospital|clinic|doctor|centre|psychologist|psychotherapist|psychiatrist)$"];
  nwr(around:${SEARCH_RADIUS_METRES},${latitude},${longitude})["social_facility"="shelter"];
  nwr(around:${SEARCH_RADIUS_METRES},${latitude},${longitude})["name"~"police|SAPS|psycholog|psychotherap|psychiatr|counsell|counsel|mental health|trauma centre|shelter",i];
);
out center tags;
`;

const getNearbyServices = async (latitude, longitude) => {
	const key = getCacheKey(latitude, longitude);
	const cached = cache.get(key);
	if (cached && cached.expiresAt > Date.now()) return cached.elements;

	const pending = pendingRequests.get(key);
	if (pending) return pending;

	const request = (async () => {
		let lastError;
		for (const url of OVERPASS_URLS) {
			for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_PROVIDER; attempt += 1) {
				const controller = new AbortController();
				const timeoutId = setTimeout(
					() => controller.abort(),
					REQUEST_TIMEOUT_MS,
				);
				let shouldRetry = false;
				try {
					const response = await fetch(url, {
						method: "POST",
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
							"User-Agent": "SaferMzansi/1.0 (nearby support services)",
						},
						body: `data=${encodeURIComponent(buildOverpassQuery(latitude, longitude))}`,
						signal: controller.signal,
					});

					if (!response.ok) {
						const detail = (await response.text()).slice(0, 300);
						lastError = new Error(
							`Overpass request to ${url} failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
						);
						shouldRetry = [429, 502, 503, 504].includes(response.status);
						console.warn("[Nearby services]", lastError.message);
					} else {
						const data = await response.json();
						const elements = Array.isArray(data.elements) ? data.elements : [];
						cache.set(key, { elements, expiresAt: Date.now() + CACHE_TTL_MS });
						return elements;
					}
				} catch (error) {
					lastError = error;
					shouldRetry = true;
					console.warn(
						`[Nearby services] Overpass request to ${url} failed:`,
						error.message,
					);
				} finally {
					clearTimeout(timeoutId);
				}

				if (shouldRetry && attempt + 1 < MAX_ATTEMPTS_PER_PROVIDER) {
					const backoffMs = 1000 * 2 ** attempt;
					console.info(
						`[Nearby services] Retrying ${url} in ${backoffMs} ms.`,
					);
					await delay(backoffMs);
				} else {
					break;
				}
			}
		}

		throw Object.assign(
			new Error(lastError?.message || "All nearby-services providers failed."),
			{ status: 503 },
		);
	})();

	pendingRequests.set(key, request);
	try {
		return await request;
	} finally {
		pendingRequests.delete(key);
	}
};

module.exports = { getNearbyServices };
