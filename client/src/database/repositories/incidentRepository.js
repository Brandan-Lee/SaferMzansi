import * as Crypto from "expo-crypto";
import { logLocalTable } from "@database/logLocalTable";

export const logLocalIncidents = (db) =>
	logLocalTable(db, "Local_Incidents");

const getTimeStamp = () =>
	new Date().toISOString().replace("T", " ").slice(0, 23);

export const createLocalIncident = async (
	db,
	userId,
	evidenceId = null,
	triggerType = "PANIC_BUTTON",
) => {
	const incidentId = Crypto.randomUUID();
	const timeStamp = getTimeStamp();

	const query = `
		INSERT INTO Local_Incidents (
			incident_id, user_id, evidence_id, trigger_type,
			status, start_time, is_synched
		) VALUES (?, ?, ?, ?, "ACTIVE", ?, 0);
	`;

	await db.runAsync(query, [
		incidentId,
		userId,
		evidenceId,
		triggerType,
		timeStamp,
	]);
	return incidentId;
};

export const updateIncidentOnCancel = async (
	db,
	incidentId,
	status = "CANCELLED",
	evidenceId = null,
) => {
	const now = getTimeStamp();
	const query = `
		UPDATE Local_Incidents
		SET status = ?, end_time = ?, evidence_id = ?, updated_at = ?, is_synched = 0
		WHERE incident_id = ?;`;

	return await db.runAsync(query, [status, now, evidenceId, now, incidentId]);
};

export const saveOrUpdateLocalIncident = async (db, userId, incidentData) => {
	const {
		incidentId,
		evidenceId = null,
		triggerType = "PANIC_BUTTON",
		status = "ACTIVE",
		trackingToken = null,
		startTime,
		endTime = null,
		isSynched = 0,
		isDeleted = 0,
	} = incidentData;

	if (!incidentId || !userId) {
		throw new Error(
			"incidentId and userId are required to save or update an incident.",
		);
	}

	const timestamp = getTimeStamp();
	const incidentStartTime = startTime || timestamp;

	const query = `
        INSERT INTO Local_Incidents (
            incident_id, user_id, evidence_id, trigger_type,
            status, tracking_token, start_time, end_time,
            is_deleted, is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(incident_id) DO UPDATE SET
            evidence_id = excluded.evidence_id,
            trigger_type = excluded.trigger_type,
            status = excluded.status,
            tracking_token = excluded.tracking_token,
            end_time = excluded.end_time,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted,
            is_synched = excluded.is_synched;
    `;

	await db.runAsync(query, [
		incidentId,
		userId,
		evidenceId,
		triggerType,
		status,
		trackingToken,
		incidentStartTime,
		endTime,
		isDeleted,
		isSynched,
	]);
};
