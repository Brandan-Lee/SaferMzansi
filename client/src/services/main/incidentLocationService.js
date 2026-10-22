import { postApi, safeApiCall } from "@services/ApiClient";

export const postLocationOnline = async (db, locationPayload) => {
	if (!db || !locationPayload || typeof locationPayload !== "object") {
		throw new Error("A database and incident location are required.");
	}

	try {
		const result = await safeApiCall(
			() => postApi("/locations/add", locationPayload),
			"Server failed to save incident location. Saved locally for offline sync.",
		);

		if (result?.success && locationPayload.location_id) {
			await db.runAsync(
				`UPDATE Local_Incident_Locations SET is_synched = 1 WHERE location_id = ?;`,
				[locationPayload.location_id],
			);
		}

		return result;
	} catch (error) {
		console.warn("[Location Service] Online location posting warning:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Could not save location.",
		};
	}
};
