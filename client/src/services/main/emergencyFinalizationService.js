import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateIncidentOnCancel } from "@database/repositories/incidentRepository";
import { addEvidence } from "@services/main/evidenceService";
import { postIncidentOnline } from "@services/main/incidentService";
import { STORAGE_KEYS } from "@constants/storageKeys";

// Save optional audio evidence, then update and sync the incident's final status.
export const finalizeEmergencyOnCancel = async (
	db,
	incidentId,
	userId,
	audioUri = null,
	finalStatus = "CANCELLED",
) => {
	try {
		const isAudioAllowed =
			(await AsyncStorage.getItem(STORAGE_KEYS.AUTO_RECORDING)) === "true";
		const evidenceRequired = isAudioAllowed && Boolean(audioUri);
		let evidenceId = null;
		let serverEvidenceId = null;
		let evidenceError = null;

		if (isAudioAllowed && audioUri) {
			try {
				const evidenceResult = await addEvidence(db, userId, {
					file_type: "audio/mp4",
					local_file_url: audioUri,
					file_size: 0,
					file_name: `emergency_audio_${incidentId || Date.now()}.mp4`,
				});

				if (evidenceResult?.success) {
					evidenceId = evidenceResult.evidenceId;
					if (evidenceResult.syncedWithServer) {
						serverEvidenceId = evidenceResult.evidenceId;
					}
				}
			} catch (error) {
				evidenceError = error.message;
				console.error(
					"[Emergency Dispatch] Failed to save emergency audio:",
					error,
				);
			}
		}

		const endTime = new Date().toISOString();
		let incident = null;
		if (incidentId) {
			incident = await db.getFirstAsync(
				"SELECT evidence_id, trigger_type, start_time, tracking_token FROM Local_Incidents WHERE incident_id = ?",
				[incidentId],
			);
			if (!incident) {
				throw new Error("The local emergency incident could not be found.");
			}
			await updateIncidentOnCancel(
				db,
				incidentId,
				finalStatus,
				evidenceId,
				endTime,
			);
		}

		const syncResult = incidentId
			? await postIncidentOnline(db, {
					incident_id: incidentId,
					user_id: userId,
					trigger_type: incident?.trigger_type || "STANDARD_PANIC",
					start_time: incident?.start_time || endTime,
					status: finalStatus,
					evidence_id: serverEvidenceId || incident?.evidence_id || null,
					tracking_token: incident?.tracking_token || null,
					end_time: endTime,
				})
			: null;
		let warning = null;
		if (evidenceRequired && !evidenceId) {
			warning = `Audio evidence could not be saved: ${evidenceError || "no evidence was created."}`;
		} else if (evidenceId && !serverEvidenceId) {
			warning =
				"Evidence is saved locally, but could not be linked on the server because its evidence record was not synced.";
		} else if (incidentId && !syncResult?.success) {
			warning =
				"Incident updates are saved locally but could not be synced to the server.";
		}

		return {
			success: true,
			evidenceRequired,
			evidenceSaved: Boolean(evidenceId),
			evidenceId,
			evidenceSyncedWithServer: Boolean(serverEvidenceId),
			incidentSyncedWithServer: syncResult?.success === true,
			warning,
		};
	} catch (error) {
		console.error(
			"[Emergency Dispatch] Failed to finalize emergency:",
			error,
		);
		return { success: false, error: error.message };
	}
};
