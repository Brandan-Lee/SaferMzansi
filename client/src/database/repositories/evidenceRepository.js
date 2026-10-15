const getTimestamp = () => new Date().toISOString().replace("T", " ").slice(0, 23);

// Format bytes to readable size
const formatFileSize = (bytes) => {
	if (!bytes) return "Encrypted file";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Map MIME type to file type and icon
const getFileTypeInfo = (mimeType = "") => {
	if (mimeType.startsWith("image/")) return { type: "image", icon: "file" };
	if (mimeType.startsWith("video/")) return { type: "video", icon: "file" };
	if (mimeType.startsWith("audio/")) return { type: "audio", icon: "mic" };
	if (mimeType.includes("pdf")) return { type: "pdf", icon: "file-text" };
	return { type: "file", icon: "file" };
};

export const insertLocalEvidence = async (db, payload) => {
	const { evidenceId, userId, fileType, localFileUrl, sha256Hash, fileSize } = payload;

	const query = `
        INSERT INTO Local_Evidence_Vault (
            evidence_id, user_id, file_type, local_file_url, 
            sha256_hash, file_size, captured_at, is_deleted, is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0);
    `;

	return await db.runAsync(query, [
		evidenceId, userId, fileType, localFileUrl,
		sha256Hash, fileSize, getTimestamp()
	]);
};

// Optional helper if your sync needs an upsert fallback matching your base columns
export const saveOrUpdateLocalEvidence = async (db, userId, evidenceData) => {
	const {
		evidenceId,
		fileType,
		localFileUrl = "",
		cloudFileUrl = "",
		sha256Hash,
		fileSize,
		isSynched = 0,
		isDeleted = 0
	} = evidenceData;

	if (!evidenceId || !userId) {
		throw new Error("evidenceId and userId are required to save or update evidence.");
	}

	const query = `
        INSERT INTO Local_Evidence_Vault (
            evidence_id, user_id, file_type, local_file_url, cloud_file_url,
            sha256_hash, file_size, captured_at, is_deleted, is_synched, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(evidence_id) DO UPDATE SET
            file_type = excluded.file_type,
            local_file_url = excluded.local_file_url,
            cloud_file_url = excluded.cloud_file_url,
            sha256_hash = excluded.sha256_hash,
            file_size = excluded.file_size,
            is_synched = excluded.is_synched,
            is_deleted = excluded.is_deleted,
            updated_at = excluded.updated_at
    `;

	await db.runAsync(query, [
		evidenceId, userId, fileType, localFileUrl, cloudFileUrl,
		sha256Hash, fileSize, getTimestamp(), isDeleted, isSynched, getTimestamp()
	]);
};

export const softDeleteLocalEvidence = async (db, userId, evidenceId) => {
	const now = getTimestamp();
	const query = `
        UPDATE Local_Evidence_Vault
        SET is_deleted = 1, deleted_at = ?, updated_at = ?, is_synched = 0
        WHERE evidence_id = ? AND user_id = ?;
    `;
	const result = await db.runAsync(query, [now, now, evidenceId, userId]);
	console.log("[DB REPO] Delete result changes:", result?.changes);
	return result;
};

export const getLocalEvidenceGroupedByDate = async (db, userId) => {
	const query = `
        SELECT evidence_id, user_id, file_type, local_file_url, file_size, captured_at
        FROM Local_Evidence_Vault
        WHERE user_id = ? AND is_deleted = 0
        ORDER BY captured_at DESC;
    `;
	const rows = await db.getAllAsync(query, [userId]);
	console.log("[DB REPO] Raw rows returned for user", userId, ":", rows);

	const groupsMap = {};

	rows.forEach((row) => {
		const dateObj = new Date(row.captured_at?.replace(" ", "T") || "");
		const formattedDate = isNaN(dateObj.getTime())
			? "Recent Evidence"
			: dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

		if (!groupsMap[formattedDate]) {
			groupsMap[formattedDate] = { id: formattedDate, date: formattedDate, files: [] };
		}

		const { type, icon } = getFileTypeInfo(row.file_type);

		groupsMap[formattedDate].files.push({
			evidenceId: row.evidence_id,
			mimeType: row.file_type,
			type,
			icon,
			uri: row.local_file_url,
			name: row.local_file_url?.split("/").pop() || "Evidence File",
			sizeFormatted: formatFileSize(row.file_size),
			size: row.file_size,
		});
	});

	return Object.values(groupsMap);
};

export const logLocalEvidenceDatabase = async (db) => {
	try {
		const records = await db.getAllAsync("SELECT * FROM Local_Evidence_Vault ORDER BY captured_at DESC;");
		console.log("\n================ [SQLITE LOCAL EVIDENCE VAULT] ================");

		if (!records?.length) {
			console.log("No evidence records found in Local_Evidence_Vault.");
		} else {
			console.log(`Total Evidence Records (Including Deleted): ${records.length}\n`);
			records.forEach((record, index) => {
				console.log(`--- Evidence Record #${index + 1} ---\n${JSON.stringify(record, null, 2)}\n----------------------------------------\n`);
			});
		}
		console.log("========================================================================\n");
	} catch (error) {
		console.error("Failed to log Local_Evidence_Vault database:", error);
	}
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
		console.error("[DB REPO] Failed to get local evidence total:", error);
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