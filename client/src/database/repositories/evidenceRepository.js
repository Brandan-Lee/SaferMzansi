import { logLocalTable } from "@database/logLocalTable";

export const logLocalEvidence = (db) =>
	logLocalTable(db, "Local_Evidence_Vault");

const getTimestamp = () => {
	const now = new Date();
	const localTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
	return localTime.toISOString().replace("T", " ").slice(0, 23);
};

const formatFileSize = (bytes) => {
	if (!bytes) return "Encrypted file";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileTypeInfo = (mimeType = "") => {
	if (mimeType.startsWith("image/")) return { type: "image", icon: "file" };
	if (mimeType.startsWith("video/")) return { type: "video", icon: "file" };
	if (mimeType.startsWith("audio/")) return { type: "audio", icon: "mic" };
	if (mimeType.includes("pdf")) return { type: "pdf", icon: "file-text" };
	return { type: "file", icon: "file" };
};

const formatEvidenceRowsToGroups = (rows, dateField) => {
	const groupsMap = {};

	rows.forEach((row) => {
		const dateObj = new Date(row[dateField]?.replace(" ", "T") || "");
		const formattedDate = isNaN(dateObj.getTime())
			? "Recent Evidence"
			: dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

		if (!groupsMap[formattedDate]) {
			groupsMap[formattedDate] = { id: formattedDate, date: formattedDate, files: [] };
		}

		const { type, icon } = getFileTypeInfo(row.file_type);

		groupsMap[formattedDate].files.push({
			evidence_id: row.evidence_id,
			evidenceId: row.evidence_id,
			cloud_file_url: row.cloud_file_url,
			mimeType: row.file_type,
			type,
			icon,
			uri: row.local_file_url || "",
			name:
				row.local_file_url?.split(/[\\/]/).pop() ||
				row.cloud_file_url?.split("/").pop() ||
				"Evidence File",
			sizeFormatted: formatFileSize(row.file_size),
			size: row.file_size,
			...(row.deleted_at && { deletedAt: row.deleted_at }),
		});
	});

	return Object.values(groupsMap);
};

export const insertLocalEvidence = async (db, payload) => {
	const { evidenceId, userId, fileType, localFileUrl, sha256Hash, fileSize } = payload;
	const query = `
        INSERT INTO Local_Evidence_Vault (
            evidence_id, user_id, file_type, local_file_url, 
            sha256_hash, file_size, captured_at, is_deleted, is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0);
    `;
	return await db.runAsync(query, [evidenceId, userId, fileType, localFileUrl, sha256Hash, fileSize, getTimestamp()]);
};

export const saveOrUpdateLocalEvidence = async (db, userId, evidenceData) => {
	const {
		evidenceId,
		fileType,
		localFileUrl = "",
		cloudFileUrl = "",
		sha256Hash,
		fileSize,
		isSynched = 0,
		isDeleted = 0,
		deletedAt = null,
	} = evidenceData;

	if (!evidenceId || !userId) {
		throw new Error("evidenceId and userId are required to save or update evidence.");
	}

	const query = `
        INSERT INTO Local_Evidence_Vault (
            evidence_id, user_id, file_type, local_file_url, cloud_file_url,
            sha256_hash, file_size, captured_at, is_deleted, deleted_at, is_synched, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(evidence_id) DO UPDATE SET
            file_type = excluded.file_type,
            local_file_url = CASE
                WHEN excluded.local_file_url != '' THEN excluded.local_file_url
                WHEN Local_Evidence_Vault.local_file_url LIKE 'file://%'
                    OR Local_Evidence_Vault.local_file_url LIKE 'content://%'
                THEN Local_Evidence_Vault.local_file_url
                ELSE ''
            END,
            cloud_file_url = CASE
                WHEN excluded.cloud_file_url != '' THEN excluded.cloud_file_url
                ELSE Local_Evidence_Vault.cloud_file_url
            END,
            sha256_hash = excluded.sha256_hash,
            file_size = excluded.file_size,
            is_synched = excluded.is_synched,
            is_deleted = excluded.is_deleted,
            deleted_at = excluded.deleted_at,
            updated_at = excluded.updated_at
    `;

	await db.runAsync(query, [
		evidenceId, userId, fileType, localFileUrl, cloudFileUrl,
		sha256Hash, fileSize, getTimestamp(), isDeleted, deletedAt, isSynched, getTimestamp()
	]);
};

export const softDeleteLocalEvidence = async (db, userId, evidenceId) => {
	const now = getTimestamp();
	const query = `
        UPDATE Local_Evidence_Vault
        SET is_deleted = 1, deleted_at = ?, updated_at = ?, is_synched = 0
        WHERE evidence_id = ? AND user_id = ?;
    `;
	return await db.runAsync(query, [now, now, evidenceId, userId]);
};

export const restoreLocalEvidenceQuery = async (db, userId, evidenceId) => {
	const now = getTimestamp();
	const query = `
        UPDATE Local_Evidence_Vault
        SET is_deleted = 0, deleted_at = NULL, updated_at = ?, is_synched = 0
        WHERE evidence_id = ? AND user_id = ?;
    `;
	return await db.runAsync(query, [now, evidenceId, userId]);
};

export const hardDeleteLocalEvidenceQuery = async (db, userId, evidenceId) => {
	const query = `
        DELETE FROM Local_Evidence_Vault
        WHERE evidence_id = ? AND user_id = ?;
    `;
	return await db.runAsync(query, [evidenceId, userId]);
};

export const purgeExpiredDeletedEvidence = async (db, userId) => {
	const query = `
        DELETE FROM Local_Evidence_Vault
        WHERE user_id = ? AND is_deleted = 1 AND deleted_at <= datetime('now', '-30 days');
    `;
	return await db.runAsync(query, [userId]);
};

export const getLocalEvidenceGroupedByDate = async (db, userId) => {
	const query = `
        SELECT evidence_id, user_id, file_type, local_file_url, cloud_file_url, file_size, captured_at
        FROM Local_Evidence_Vault
        WHERE user_id = ? AND is_deleted = 0
        ORDER BY captured_at DESC;
    `;
	const rows = await db.getAllAsync(query, [userId]);
	return formatEvidenceRowsToGroups(rows, "captured_at");
};

export const getDeletedEvidenceGroupedByDate = async (db, userId) => {
	const query = `
        SELECT evidence_id, user_id, file_type, local_file_url, cloud_file_url, file_size, captured_at, deleted_at
        FROM Local_Evidence_Vault
        WHERE user_id = ? AND is_deleted = 1
        ORDER BY deleted_at DESC;
    `;
	const rows = await db.getAllAsync(query, [userId]);
	return formatEvidenceRowsToGroups(rows, "deleted_at");
};

export const getLocalEvidenceTotal = async (db, userId) => {
	try {
		const query = `
            SELECT COUNT(*) as total 
            FROM Local_Evidence_Vault 
            WHERE user_id = ? AND is_deleted = 0;
        `;
		const result = await db.getFirstAsync(query, [userId]);
		return result?.total || 0;
	} catch (error) {
		return 0;
	}
};

export const markEvidenceAsSynched = async (db, evidenceId) => {
	const query = `
        UPDATE Local_Evidence_Vault 
        SET is_synched = 1, updated_at = ?
        WHERE evidence_id = ?;
    `;
	await db.runAsync(query, [getTimestamp(), evidenceId]);
};

export const markEvidenceAsUnSynched = async (db, evidenceId) => {
	await db.runAsync(
		`UPDATE Local_Evidence_Vault SET is_synched = 0 WHERE evidence_id = ?`,
		[evidenceId],
	);
};

export const updateEvidenceCloudFileUrl = async (
	db,
	evidenceId,
	cloudFileUrl,
) => {
	await db.runAsync(
		`UPDATE Local_Evidence_Vault SET cloud_file_url = ?, updated_at = ? WHERE evidence_id = ?`,
		[cloudFileUrl, getTimestamp(), evidenceId],
	);
};

export const getPendingEvidence = async (db, userId) =>
	db.getAllAsync(
		`SELECT * FROM Local_Evidence_Vault WHERE user_id = ? AND is_synched = 0 ORDER BY captured_at ASC`,
		[userId],
	);
