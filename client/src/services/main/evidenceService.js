import * as Crypto from "expo-crypto";
import { supabase } from "@config/supabase_client";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	saveOrUpdateLocalEvidence,
	markEvidenceAsSynched,
	softDeleteLocalEvidence,
	getLocalEvidenceGroupedByDate,
	getLocalEvidenceTotal as repoGetTotal,
	getDeletedEvidenceGroupedByDate,
	restoreLocalEvidenceQuery,
	hardDeleteLocalEvidenceQuery,
	purgeExpiredDeletedEvidence,
} from "@database/repositories/evidenceRepository";
import { hashFileSHA256 } from "@utils/securityAndValidation/securityUtil";

const validateRequired = (fields, errorMessage) => {
	if (fields.some((field) => !field && field !== 0)) {
		throw new Error(errorMessage);
	}
};

const extractIds = (evidenceId, userId) => ({
	safeEvidenceId: evidenceId?.evidence_id || evidenceId?.evidenceId || evidenceId,
	safeUserId: userId?.user_id || userId?.userId || userId,
});

const executeServiceAction = async (evidenceId, userId, errorMessage, actionFn) => {
	const { safeEvidenceId, safeUserId } = extractIds(evidenceId, userId);
	validateRequired([safeUserId, safeEvidenceId], errorMessage);

	try {
		return await actionFn(safeEvidenceId, safeUserId);
	} catch (error) {
		console.error(`[Evidence Service] ${errorMessage}:`, error);
		throw new Error(errorMessage);
	}
};

export const getEvidence = async (db, userId, options = {}) => {
	validateRequired([userId], "User ID is required to fetch evidence.");

	try {
		const groupedData = options.grouped
			? await getLocalEvidenceGroupedByDate(db, userId)
			: [];
		return { success: true, count: groupedData.length, data: groupedData };
	} catch (error) {
		console.error("[Evidence Service] Failed to fetch evidence:", error);
		throw new Error("Failed to load local evidence vault.");
	}
};

export const addEvidence = async (db, userId, evidenceData) => {
	validateRequired([userId], "User session is required to add evidence.");
	const { file_type, local_file_url, file_size, file_name } = evidenceData;
	validateRequired([file_type, local_file_url, file_size], "Missing required evidence fields.");

	const sha256_hash = await hashFileSHA256(local_file_url);
	const evidenceId = Crypto.randomUUID();
	const timestamp = new Date().toISOString();
	const storagePath = `${userId}/${evidenceId}_${file_name || local_file_url?.split("/").pop() || "evidence_file"}`;

	try {
		const response = await fetch(local_file_url);
		const blob = await response.blob();

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("EvidenceVault")
			.upload(storagePath, blob, { contentType: file_type, upsert: false });

		if (uploadError) throw new Error(`Cloud storage upload failed: ${uploadError.message}`);
		const cloudFileUrl = uploadData.path;

		const localPayload = {
			evidenceId, userId, fileType: file_type, localFileUrl: local_file_url,
			cloudFileUrl, sha256Hash: sha256_hash, fileSize: file_size,
			createdAt: timestamp, updatedAt: timestamp, isSynched: 0, isDeleted: 0,
		};

		await saveOrUpdateLocalEvidence(db, userId, localPayload);

		const apiPayload = {
			evidence_id: evidenceId, user_id: userId, file_type,
			cloud_file_url: cloudFileUrl, sha256_hash, file_size,
			uploaded_at: timestamp, is_deleted: false,
		};

		const result = await safeApiCall(
			() => postApi("/evidence/add", apiPayload),
			"Server failed to save evidence metadata. Saved locally for offline sync."
		);

		if (result?.success) {
			await markEvidenceAsSynched(db, evidenceId);
		} else {
			console.warn("[Evidence Service] Backend sync warning:", result?.error);
		}

		return {
			success: true,
			evidenceId,
			syncedWithServer: result?.success === true,
			message: "Evidence uploaded and saved successfully.",
		};
	} catch (error) {
		console.error("[Evidence Service] Error adding evidence:", error);
		throw error;
	}
};

export const syncEvidenceVault = async (db, userId) => {
	if (!userId) throw new Error("User ID is required to sync evidence vault.");

	const response = await safeApiCall(
		() => postApi("/evidence/get-evidence", { user_id: userId }),
		"Failed to fetch evidence from server."
	);

	if (!response.success || !Array.isArray(response.data?.evidence)) {
		return { success: false, error: response.error || "Sync failed" };
	}

	for (const item of response.data.evidence) {
		const evidenceId = item.evidence_id || item.id;
		const localPayload = {
			evidenceId, userId,
			fileType: item.file_type || "application/octet-stream",
			localFileUrl: "",
			cloudFileUrl: item.cloud_file_url || item.file_url || "",
			sha256Hash: item.sha256_hash || "",
			fileSize: item.file_size || 0,
			createdAt: item.uploaded_at || item.captured_at || new Date().toISOString(),
			updatedAt: item.uploaded_at || new Date().toISOString(),
			isSynched: 1,
			isDeleted: item.is_deleted ? 1 : 0,
			deletedAt: item.deleted_at || null,
		};

		try {
			await saveOrUpdateLocalEvidence(db, userId, localPayload);
			await markEvidenceAsSynched(db, evidenceId);
		} catch (err) {
			console.error(`[Evidence Vault] Error syncing evidence item ${evidenceId}:`, err);
		}
	}

	return { success: true, count: response.data.evidence.length };
};

export const deleteEvidence = async (db, evidenceId, userId) => {
	const { safeEvidenceId, safeUserId } = extractIds(evidenceId, userId);
	validateRequired([safeUserId, safeEvidenceId], "User ID and Evidence ID are required to delete evidence.");

	await executeServiceAction(
		safeEvidenceId,
		safeUserId,
		"Failed to delete evidence locally.",
		(id, uid) => softDeleteLocalEvidence(db, uid, id)
	);

	const result = await safeApiCall(
		() => postApi("/evidence/delete", { evidence_id: safeEvidenceId, user_id: safeUserId, is_deleted: true }),
		"Server failed to update evidence deletion status."
	);

	if (!result?.success) {
		console.warn("[Evidence Service] Backend deletion status sync failed.");
	}

	return {
		success: true,
		message: "Evidence moved to recycle bin successfully.",
		syncedWithServer: result?.success || false,
	};
};

export const getEvidenceTotal = async (db, userId) => {
	if (!userId) return 0;
	try {
		return await repoGetTotal(db, userId);
	} catch (error) {
		console.error("[Evidence Service] Failed to get evidence total:", error);
		return 0;
	}
};

export const getDeletedEvidence = async (db, userId) => {
	validateRequired([userId], "User ID is required to fetch deleted evidence.");

	try {
		await purgeExpiredDeletedEvidence(db, userId);
		const groupedData = await getDeletedEvidenceGroupedByDate(db, userId);
		return { success: true, count: groupedData.length, data: groupedData };
	} catch (error) {
		console.error("[Evidence Service] Failed to fetch deleted evidence:", error);
		throw new Error("Failed to load recycle bin items.");
	}
};

export const restoreEvidence = async (db, evidenceId, userId) => {
	await executeServiceAction(
		evidenceId,
		userId,
		"Failed to restore evidence.",
		(id, uid) => restoreLocalEvidenceQuery(db, uid, id)
	);
	return { success: true, message: "Evidence restored successfully." };
};

export const permanentlyDeleteEvidence = async (db, evidenceId, userId) => {
	const { safeEvidenceId, safeUserId } = extractIds(evidenceId, userId);
	validateRequired([safeUserId, safeEvidenceId], "User ID and Evidence ID are required for permanent deletion.");

	await executeServiceAction(
		safeEvidenceId,
		safeUserId,
		"Failed to remove evidence from local database.",
		(id, uid) => hardDeleteLocalEvidenceQuery(db, uid, id)
	);

	try {
		const { data: fileList } = await supabase.storage
			.from("EvidenceVault")
			.list(safeUserId, { search: safeEvidenceId });

		if (fileList?.length) {
			await supabase.storage
				.from("EvidenceVault")
				.remove(fileList.map((file) => `${safeUserId}/${file.name}`));
		}
	} catch (e) {
		console.error("Cloud storage media purge skipped:", e);
	}

	try {
		await safeApiCall(
			() => postApi("/evidence/permanent-delete", { evidence_id: safeEvidenceId, user_id: safeUserId }),
			"Server failed to permanently delete evidence."
		);
	} catch (apiErr) {
		console.warn("Backend permanent delete notification warning:", apiErr);
	}

	return { success: true, message: "Evidence permanently deleted." };
};