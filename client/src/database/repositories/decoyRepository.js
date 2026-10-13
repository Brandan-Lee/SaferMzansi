export const softDeleteDecoysLocally = async (db, userId) => {
	const now = new Date().toISOString;

	await db.runAsync(
		`UPDATE Decoy SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE user_id = ?`,
		[now, now, userId],
	);
};

export const restoreDecoysLocally = async (db, userId) => {
	const now = new Date().toISOString();
	await db.runAsync(
		`UPDATE Decoy SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE user_id = ?`,
		[now, userId],
	);
};
