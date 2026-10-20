import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import { File, Paths } from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
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
	getPendingEvidence,
	updateEvidenceCloudFileUrl,
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

const syncPendingEvidence = async (db, userId, onlyEvidenceId = null) => {
	const pendingEvidence = await getPendingEvidence(db, userId);
	const network = await NetInfo.fetch();
	if (
		!network.isConnected ||
		network.isInternetReachable === false
	) {
		return false;
	}

	const items = onlyEvidenceId
		? pendingEvidence.filter((item) => item.evidence_id === onlyEvidenceId)
		: pendingEvidence;
	let allSynced = true;

	for (const item of items) {
		try {
			if (item.is_deleted) {
				let cloudFileUrl = item.cloud_file_url;
				if (!cloudFileUrl) {
					const file = new File(item.local_file_url);
					if (!file.exists) {
						throw new Error(`Evidence file is missing locally: ${item.evidence_id}`);
					}
					const response = await fetch(file.uri);
					const blob = await response.blob();
					const storagePath = `${userId}/${item.evidence_id}_${file.name}`;
					const { data: uploadData, error: uploadError } =
						await supabase.storage
							.from("EvidenceVault")
							.upload(storagePath, blob, {
								contentType: item.file_type,
								upsert: true,
							});
					if (uploadError) {
						throw new Error(`Cloud storage upload failed: ${uploadError.message}`);
					}
					cloudFileUrl = uploadData.path;
					await updateEvidenceCloudFileUrl(db, item.evidence_id, cloudFileUrl);
				}

				const addResult = await safeApiCall(
					() =>
						postApi("/evidence/add", {
							evidence_id: item.evidence_id,
							user_id: userId,
							file_type: item.file_type,
							cloud_file_url: cloudFileUrl,
							sha256_hash: item.sha256_hash,
							file_size: item.file_size,
							uploaded_at: item.captured_at,
							is_deleted: false,
						}),
					"Server failed to create evidence metadata.",
				);
				if (!addResult.success) {
					const fetched = await safeApiCall(
						() => postApi("/evidence/get-evidence", { user_id: userId }),
						"Failed to confirm evidence metadata.",
					);
					const serverEvidence = fetched.data?.data?.evidence;
					const exists = Array.isArray(serverEvidence)
						? serverEvidence.some(
								(serverItem) =>
									(serverItem.evidence_id || serverItem.id) ===
									item.evidence_id,
							)
						: false;
					if (!exists) {
						throw new Error(addResult.error || "Evidence metadata sync failed.");
					}
				}

				const deleteResult = await safeApiCall(
					() =>
						postApi("/evidence/delete", {
							evidence_id: item.evidence_id,
							user_id: userId,
						}),
					"Server failed to sync evidence deletion.",
				);
				if (!deleteResult.success) {
					const fetched = await safeApiCall(
						() => postApi("/evidence/get-evidence", { user_id: userId }),
						"Failed to confirm evidence deletion.",
					);
					const serverEvidence = fetched.data?.data?.evidence;
					const serverItem = Array.isArray(serverEvidence)
						? serverEvidence.find(
								(row) =>
									(row.evidence_id || row.id) === item.evidence_id,
							)
						: null;
					if (!serverItem?.is_deleted) {
						throw new Error(deleteResult.error || "Evidence deletion sync failed.");
					}
				}
				await markEvidenceAsSynched(db, item.evidence_id);
				continue;
			}

			let cloudFileUrl = item.cloud_file_url;
			if (!cloudFileUrl) {
				const file = new File(item.local_file_url);
				if (!file.exists) {
					throw new Error(`Evidence file is missing locally: ${item.evidence_id}`);
				}
				const response = await fetch(file.uri);
				const blob = await response.blob();
				const storagePath = `${userId}/${item.evidence_id}_${file.name}`;
				const { data: uploadData, error: uploadError } = await supabase.storage
					.from("EvidenceVault")
					.upload(storagePath, blob, {
						contentType: item.file_type,
						upsert: true,
					});

				if (uploadError) {
					throw new Error(`Cloud storage upload failed: ${uploadError.message}`);
				}

				cloudFileUrl = uploadData.path;
				await updateEvidenceCloudFileUrl(db, item.evidence_id, cloudFileUrl);
			}

			const result = await safeApiCall(
				() =>
					postApi("/evidence/restore", {
						evidence_id: item.evidence_id,
						user_id: userId,
					}),
				"Server failed to restore evidence.",
			);
			if (result.success) {
				await markEvidenceAsSynched(db, item.evidence_id);
				continue;
			}

			const addResult = await safeApiCall(
				() =>
					postApi("/evidence/add", {
						evidence_id: item.evidence_id,
						user_id: userId,
						file_type: item.file_type,
						cloud_file_url: cloudFileUrl,
						sha256_hash: item.sha256_hash,
						file_size: item.file_size,
						uploaded_at: item.captured_at,
						is_deleted: false,
					}),
				"Server failed to save evidence metadata.",
			);

			if (!addResult.success) {
				const fetched = await safeApiCall(
					() => postApi("/evidence/get-evidence", { user_id: userId }),
					"Failed to confirm evidence metadata.",
				);
				const serverEvidence = fetched.data?.data?.evidence;
				const existing = Array.isArray(serverEvidence)
					? serverEvidence.find(
							(serverItem) =>
								(serverItem.evidence_id || serverItem.id) === item.evidence_id,
						)
					: null;

				if (existing?.is_deleted) {
					const restoreResult = await safeApiCall(
						() =>
							postApi("/evidence/restore", {
								evidence_id: item.evidence_id,
								user_id: userId,
							}),
						"Server failed to restore evidence.",
					);
					if (!restoreResult.success) {
						throw new Error(restoreResult.error || "Evidence restore failed.");
					}
				} else if (!existing) {
					throw new Error(addResult.error || "Evidence metadata sync failed.");
				}
			}
			await markEvidenceAsSynched(db, item.evidence_id);
		} catch (error) {
			allSynced = false;
			console.warn(
				`[Evidence Service] Evidence ${item.evidence_id} remains queued for sync:`,
				error,
			);
		}
	}

	return allSynced && items.length > 0;
};

export const syncQueuedEvidence = async (db, userId) => {
	const pending = await getPendingEvidence(db, userId);
	if (!pending.length) return { success: true, count: 0 };
	await syncPendingEvidence(db, userId);
	const remaining = await getPendingEvidence(db, userId);
	return {
		success: remaining.length === 0,
		count: pending.length - remaining.length,
	};
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
	} else {
		await markEvidenceAsSynched(db, safeEvidenceId);
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