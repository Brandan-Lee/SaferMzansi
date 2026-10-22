import { postApi, safeApiCall } from "@services/ApiClient";
import { saveOrUpdateLocalIncident } from "@database/repositories/incidentRepository";
import { syncQueuedEvidence } from "./evidenceSyncService";

export const syncIncidents = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is required to sync incidents.");
	}

	const response = await safeApiCall(
		() => postApi("/incidents/get-incidents", { user_id: userId }),
		"Failed to fetch incidents from server.",
	);

	if (!response.success || !Array.isArray(response.data?.incidents)) {
		return { success: false, error: response.error || "Sync failed" };
	}

	const serverIncidents = response.data.incidents;
	const pendingIncidents = await db.getAllAsync(
		"SELECT incident_id FROM Local_Incidents WHERE is_synched = 0",
	);
	const pendingIncidentIds = new Set(
		pendingIncidents.map((incident) => incident.incident_id),
	);

	for (const item of serverIncidents) {
		const incidentId = item.incident_id || item.id;
		if (pendingIncidentIds.has(incidentId)) continue;

		const localPayload = {
			incidentId,
			userId,
			evidenceId: item.evidence_id || null,
			triggerType: item.trigger_type || "PANIC_BUTTON",
			status: item.status || "ACTIVE",
			trackingToken: item.tracking_token || null,
			startTime: item.start_time || new Date().toISOString(),
			endTime: item.end_time || null,
			isSynched: 1,
			isDeleted: item.is_deleted ? 1 : 0,
		};

		try {
			await saveOrUpdateLocalIncident(db, userId, localPayload);
		} catch (err) {
			console.error(
				`[Incident Service] Error syncing incident item ${incidentId}:`,
				err,
			);
		}
	}

	return { success: true, count: serverIncidents.length };
};

export const postIncidentOnline = async (db, incidentPayload) => {
	try {
		let payloadToSync = incidentPayload;
		if (incidentPayload.incident_id) {
			const localIncident = await db.getFirstAsync(
				`SELECT evidence_id FROM Local_Incidents WHERE incident_id = ?`,
				[incidentPayload.incident_id],
			);
			const evidenceId = localIncident?.evidence_id;
			if (evidenceId) {
				await syncQueuedEvidence(db, incidentPayload.user_id);
				const evidence = await db.getFirstAsync(
					`SELECT is_synched FROM Local_Evidence_Vault WHERE evidence_id = ?`,
					[evidenceId],
				);
				if (!evidence?.is_synched) {
					return {
						success: false,
						error: "Incident is queued until its evidence is synced.",
					};
				}
				payloadToSync = { ...incidentPayload, evidence_id: evidenceId };
			}
		}

		const result = await safeApiCall(
			() => postApi("/incidents/add", payloadToSync),
			"Server failed to save incident metadata. Saved locally for offline sync.",
		);

		if (result?.success && payloadToSync.incident_id) {
			await db.runAsync(
				`UPDATE Local_Incidents SET is_synched = 1 WHERE incident_id = ?;`,
				[payloadToSync.incident_id],
			);
		}

		return result;
	} catch (error) {
		console.warn("[Incident Service] Online incident posting warning:", error);
		return { success: false, error: error.message };
	}
};
