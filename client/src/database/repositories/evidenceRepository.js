export const softDeleteEvidenceAndLocationsLocally = async (
	db,
	incidentIds,
) => {
	if (!incidentIds || incidentIds.length === 0) return;
	const now = new Date().toISOString();
	const placeholders = incidentIds.map(() => "?").join(",");

	// Soft delete evidence
	await db.runAsync(
		`UPDATE Local_Evidence_Vault SET is_deleted = 1, deleted_at = ?, updated_at = ?, is_synched = 0 WHERE incident_id IN (${placeholders})`,
		[now, now, ...incidentIds],
	);

	// Soft delete locations
	await db.runAsync(
		`UPDATE Local_Incident_Locations SET is_deleted = 1, deleted_at = ?, updated_at = ?, is_synched = 0 WHERE incident_id IN (${placeholders})`,
		[now, now, ...incidentIds],
	);
};

export const restoreEvidenceAndLocationsLocally = async (db, incidentIds) => {
	if (!incidentIds || incidentIds.length === 0) return;
	const now = new Date().toISOString();
	const placeholders = incidentIds.map(() => "?").join(",");

	// Restore evidence
	await db.runAsync(
		`UPDATE Local_Evidence_Vault SET is_deleted = 0, deleted_at = NULL, updated_at = ?, is_synched = 1 WHERE incident_id IN (${placeholders})`,
		[now, ...incidentIds],
	);

	// Restore locations
	await db.runAsync(
		`UPDATE Local_Incident_Locations SET is_deleted = 0, deleted_at = NULL, updated_at = ?, is_synched = 1 WHERE incident_id IN (${placeholders})`,
		[now, ...incidentIds],
	);
};
