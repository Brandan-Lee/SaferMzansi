const assert = require("node:assert/strict");
const test = require("node:test");

const { fetchPlaces } = require("../src/services/main/geoapifyClientServer");

test("fetchPlaces builds a bounded Geoapify search request", async () => {
	const originalFetch = global.fetch;
	let requestedUrl;
	let requestedOptions;

	global.fetch = async (url, options) => {
		requestedUrl = new URL(url);
		requestedOptions = options;
		return new Response(JSON.stringify({ features: [{ id: "place-1" }] }), {
			status: 200,
		});
	};

	try {
		const features = await fetchPlaces(1, 2, "test-key", ["service.police"]);

		assert.deepEqual(features, [{ id: "place-1" }]);
		assert.equal(requestedUrl.searchParams.get("categories"), "service.police");
		assert.equal(
			requestedUrl.searchParams.get("filter"),
			"circle:2,1,20000",
		);
		assert.equal(requestedOptions.headers["x-api-key"], "test-key");
		assert.ok(requestedOptions.signal instanceof AbortSignal);
	} finally {
		global.fetch = originalFetch;
	}
});

test("fetchPlaces reports provider errors instead of hiding them", async () => {
	const originalFetch = global.fetch;
	global.fetch = async () => new Response("Provider unavailable", { status: 503 });

	try {
		await assert.rejects(
			fetchPlaces(1, 2, "test-key", ["service.police"]),
			/HTTP 503: Provider unavailable/,
		);
	} finally {
		global.fetch = originalFetch;
	}
});
