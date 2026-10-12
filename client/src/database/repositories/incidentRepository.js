export const softDeleteIncidentsLocally = async (db, userId) => {
	const now = new Date().toISOString();

	// Fetch incident IDs first
	const incidents = await db.getAllAsync(
		`SELECT incident_id FROM Local_Incidents WHERE user_id = ?`,
		[userId],
	);
	const incidentIds = incidents.map((inc) => inc.incident_id);

	// Update incidents
	await db.runAsync(
		`UPDATE Local_Incidents SET is_deleted = 1, deleted_at = ?, updated_at = ?, is_synched = 0 WHERE user_id = ?`,
		[now, now, userId],
	);

	return incidentIds;
};

export const restoreIncidentsLocally = async (db, userId) => {
	const now = new Date().toISOString();

	const incidents = await db.getAllAsync(
		`SELECT incident_id FROM Local_Incidents WHERE user_id = ?`,
		[userId],
	);
	const incidentIds = incidents.map((inc) => inc.incident_id);

	await db.runAsync(
		`UPDATE Local_Incidents SET is_deleted = 0, deleted_at = NULL, updated_at = ?, is_synched = 1 WHERE user_id = ?`,
		[now, userId],
	);

	return incidentIds;
};
