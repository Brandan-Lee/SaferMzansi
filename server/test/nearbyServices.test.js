const assert = require("node:assert/strict");
const test = require("node:test");

const { getNearbyServices } = require("../src/services/main/nearbyServicesServiceServer");

test("nearby services returns supplemental results when the combined lookup fails", async () => {
	const originalFetch = global.fetch;
	const originalApiKey = process.env.GEOAPIFY_API_KEY;
	process.env.GEOAPIFY_API_KEY = "test-key";

	global.fetch = async (url) => {
		const categories = new URL(url).searchParams.get("categories");
		if (categories.includes("service.police")) {
			return new Response("Unsupported combined query", { status: 400 });
		}

		return new Response(
			JSON.stringify({
				features: [
					{
						properties: {
							place_id: "shelter-test",
							name: "Community Shelter",
							categories: ["service.social_facility.shelter"],
							lat: -28.1234,
							lon: 26.1234,
						},
						geometry: { coordinates: [26.1234, -28.1234] },
					},
				],
			}),
			{ status: 200 },
		);
	};

	try {
		const results = await getNearbyServices(-28.1234, 26.1234);
		assert.equal(results.length, 1);
		assert.equal(results[0].id, "shelter-test");
		assert.equal(results[0].category, "shelter");
	} finally {
		global.fetch = originalFetch;
		if (originalApiKey === undefined) {
			delete process.env.GEOAPIFY_API_KEY;
		} else {
			process.env.GEOAPIFY_API_KEY = originalApiKey;
		}
	}
});
