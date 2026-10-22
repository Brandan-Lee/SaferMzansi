import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import { File, Paths } from "expo-file-system";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	syncEvidenceDeletion,
	syncPendingEvidence,
} from "@services/main/evidenceSyncService";
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
	validateRequired([file_type, local_file_url], "Missing required evidence fields.");
	const evidenceId = Crypto.randomUUID();
	const timestamp = new Date().toISOString();
	const sourceFile = new File(local_file_url);
	const safeName = (file_name || sourceFile.name || "evidence_file").replace(
		/[^a-zA-Z0-9._-]/g,
		"_",
	);
	const cachedFile = new File(
		Paths.document,
		`${evidenceId}_${safeName}`,
	);

	try {
		if (sourceFile.uri !== cachedFile.uri && !cachedFile.exists) {
			await FileSystem.copyAsync({
				from: local_file_url,
				to: cachedFile.uri,
			});
		}
		const sha256Hash = await hashFileSHA256(cachedFile.uri);

		const localPayload = {
			evidenceId, userId, fileType: file_type, localFileUrl: cachedFile.uri,
			cloudFileUrl: "", sha256Hash, fileSize: file_size || cachedFile.size || 0,
			createdAt: timestamp, updatedAt: timestamp, isSynched: 0, isDeleted: 0,
		};

		await saveOrUpdateLocalEvidence(db, userId, localPayload);
		const syncResult = await syncPendingEvidence(db, userId, evidenceId);

		return {
			success: true,
			evidenceId,
			syncedWithServer: syncResult,
			message: syncResult
				? "Evidence uploaded and saved successfully."
				: "Evidence saved on this device and will upload when online.",
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

	const serverEvidence =
		response.data?.data?.evidence || response.data?.evidence;
	if (!response.success || !Array.isArray(serverEvidence)) {
		return { success: false, error: response.error || "Sync failed" };
	}

	for (const item of serverEvidence) {
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

	return { success: true, count: serverEvidence.length };
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

	const deletionSynced = await syncEvidenceDeletion(
		{ evidence_id: safeEvidenceId },
		safeUserId,
	);

	if (!deletionSynced) {
		console.warn("[Evidence Service] Backend deletion status sync failed.");
	} else {
		await markEvidenceAsSynched(db, safeEvidenceId);
	}

	return {
		success: true,
		message: "Evidence moved to recycle bin successfully.",
		syncedWithServer: deletionSynced,
	};
};

export const getEvidenceTotal = async (db, userId) => {
	if (!userId) return 0;
	return repoGetTotal(db, userId);
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
	const { safeEvidenceId, safeUserId } = extractIds(evidenceId, userId);
	const result = await safeApiCall(
		() =>
			postApi("/evidence/restore", {
				evidence_id: safeEvidenceId,
				user_id: safeUserId,
			}),
		"Server failed to restore evidence.",
	);
	if (result.success) {
		await markEvidenceAsSynched(db, safeEvidenceId);
	}
	return {
		success: true,
		syncedWithServer: result.success,
		message: "Evidence restored successfully.",
	};
};

export const permanentlyDeleteEvidence = async (db, evidenceId, userId) => {
	const { safeEvidenceId, safeUserId } = extractIds(evidenceId, userId);
	validateRequired([safeUserId, safeEvidenceId], "User ID and Evidence ID are required for permanent deletion.");

	const result = await safeApiCall(
		() =>
			postApi("/evidence/permanent-delete", {
				evidence_id: safeEvidenceId,
				user_id: safeUserId,
			}),
		"Server failed to permanently delete evidence.",
	);

	if (!result.success) {
		throw new Error(result.error || "Server failed to permanently delete evidence.");
	}

	try {
		const localEvidence = await db.getFirstAsync(
			"SELECT local_file_url FROM Local_Evidence_Vault WHERE evidence_id = ? AND user_id = ?",
			[safeEvidenceId, safeUserId],
		);
		await hardDeleteLocalEvidenceQuery(db, safeUserId, safeEvidenceId);

		const localFileUrl = localEvidence?.local_file_url;
		if (
			localFileUrl?.startsWith("file://") ||
			localFileUrl?.startsWith("content://")
		) {
			try {
				await FileSystem.deleteAsync(localFileUrl, { idempotent: true });
			} catch (error) {
				console.warn(
					"[Evidence Service] Could not remove the local evidence file:",
					error,
				);
			}
		}
	} catch (error) {
		console.error("[Evidence Service] Failed to remove local evidence:", error);
		throw new Error("Cloud evidence was deleted, but the local record could not be removed.");
	}

	return { success: true, message: "Evidence permanently deleted." };
};