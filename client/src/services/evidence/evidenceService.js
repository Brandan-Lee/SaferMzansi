import * as Crypto from "expo-crypto";
import { supabase } from "@config/supabase_client";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	saveOrUpdateLocalEvidence,
	markEvidenceAsSynched,
	softDeleteLocalEvidence,
	getLocalEvidenceGroupedByDate,
	getLocalEvidenceTotal as repoGetTotal,
} from "@database/repositories/evidenceRepository";
import { hashFileSHA256 } from "@utils/securityAndValidation/securityUtil";

const validateRequired = (fields, errorMessage) => {
	if (fields.some((field) => !field && field !== 0)) {
		throw new Error(errorMessage);
	}
};

export const getEvidence = async (db, userId, options = {}) => {
	validateRequired([userId], "User ID is required to fetch evidence.");

	try {
		const groupedData = options.grouped
			? await getLocalEvidenceGroupedByDate(db, userId)
			: [];
		return {
			success: true,
			count: groupedData.length,
			data: groupedData,
		};
	} catch (error) {
		console.error("[Evidence Service] Failed to fetch evidence:", error);
		throw new Error("Failed to load local evidence vault.");
	}
};

export const addEvidence = async (db, userId, evidenceData) => {
	validateRequired([userId], "User session is required to add evidence.");

	const {
		file_type,
		local_file_url,
		file_size,
		file_name,
		title,
		description,
		category,
	} = evidenceData;
	validateRequired(
		[file_type, local_file_url, file_size],
		"Missing required evidence fields.",
	);

	const sha256_hash = await hashFileSHA256(local_file_url);

	const evidenceId = Crypto.randomUUID();
	const timestamp = new Date().toISOString();
	const safeFileName =
		file_name || local_file_url?.split("/").pop() || "evidence_file";
	const storagePath = `${userId}/${evidenceId}_${safeFileName}`;

	try {
		// 1. Upload to Supabase Storage Bucket
		const response = await fetch(local_file_url);
		const blob = await response.blob();

		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("EvidenceVault")
			.upload(storagePath, blob, {
				contentType: file_type,
				upsert: false,
			});

		if (uploadError) {
			throw new Error(`Cloud storage upload failed: ${uploadError.message}`);
		}

		const cloudFileUrl = uploadData.path;

		// 2. Save metadata locally to SQLite
		const localPayload = {
			evidenceId,
			userId,
			fileType: file_type,
			localFileUrl: local_file_url,
			cloudFileUrl: cloudFileUrl,
			sha256Hash: sha256_hash,
			fileSize: file_size,
			createdAt: timestamp,
			updatedAt: timestamp,
			isSynched: 0,
			isDeleted: 0,
		};

		await saveOrUpdateLocalEvidence(db, userId, localPayload);

		// 3. Send payload to backend server (matching server schema column names like uploaded_at)
		const apiPayload = {
			evidence_id: evidenceId,
			user_id: userId,
			file_type: file_type,
			cloud_file_url: cloudFileUrl,
			sha256_hash: sha256_hash,
			file_size: file_size,
			uploaded_at: timestamp,
			is_deleted: false,
		};

		const result = await safeApiCall(
			() => postApi("/evidence/add", apiPayload),
			"Server failed to save evidence metadata. Saved locally for offline sync.",
		);

		if (result?.success) {
			await markEvidenceAsSynched(db, evidenceId);
		} else {
			console.warn("[Evidence Service] Backend sync warning:", result?.error);
		}

		return {
			success: true,
			evidenceId,
			message: "Evidence uploaded and saved successfully.",
		};
	} catch (error) {
		console.error("[Evidence Service] Error adding evidence:", error);
		throw error;
	}
};

export const syncEvidenceVault = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is required to sync evidence vault.");
	}

	const response = await safeApiCall(
		() => postApi("/evidence/get-evidence", { user_id: userId }),
		"Failed to fetch evidence from server.",
	);

	if (!response.success || !Array.isArray(response.data?.evidence)) {
		return { success: false, error: response.error || "Sync failed" };
	}

	const serverEvidenceList = response.data.evidence;

	for (const item of serverEvidenceList) {
		const evidenceId = item.evidence_id || item.id;

		const localPayload = {
			evidenceId,
			userId,
			fileType: item.file_type || "application/octet-stream",
			localFileUrl: "",
			cloudFileUrl: item.cloud_file_url || item.file_url || "",
			sha256Hash: item.sha256_hash || "",
			fileSize: item.file_size || 0,
			createdAt:
				item.uploaded_at || item.captured_at || new Date().toISOString(),
			updatedAt: item.uploaded_at || new Date().toISOString(),
			isSynched: 1,
			isDeleted: item.is_deleted ? 1 : 0,
		};

		try {
			await saveOrUpdateLocalEvidence(db, userId, localPayload);
			await markEvidenceAsSynched(db, evidenceId);
		} catch (err) {
			console.error(
				`[Evidence Vault] Error syncing evidence item ${evidenceId}:`,
				err,
			);
		}
	}

	return { success: true, count: serverEvidenceList.length };
};

export const deleteEvidence = async (db, evidenceId, userId) => {
	const safeEvidenceId =
		evidenceId?.evidence_id || evidenceId?.evidenceId || evidenceId;
	const safeUserId = userId?.user_id || userId?.userId || userId;

	validateRequired(
		[safeUserId, safeEvidenceId],
		"User ID and Evidence ID are required to delete evidence.",
	);

	// 1. Soft delete locally
	try {
		await softDeleteLocalEvidence(db, safeUserId, safeEvidenceId);
	} catch (error) {
		console.error(
			"[Evidence Service] Failed to delete evidence locally:",
			error,
		);
		throw new Error("Failed to delete evidence locally.");
	}

	// 2. Notify backend
	const apiPayload = { evidence_id: safeEvidenceId, user_id: safeUserId };
	const result = await safeApiCall(
		() => postApi("/evidence/delete", apiPayload),
		"Server failed to delete evidence.",
	);

	if (!result?.success) {
		console.warn(
			"[Evidence Service] Backend deletion failed, proceeding with local & storage cleanup.",
		);
	}

	// 3. Clear cloud storage bucket asset
	try {
		console.log(
			`[Evidence Service] Attempting cloud storage purge for item ID: ${safeEvidenceId}`,
		);

		const { data: fileList, error: listError } = await supabase.storage
			.from("EvidenceVault")
			.list(safeUserId, { search: safeEvidenceId });

		if (!listError && fileList && fileList.length > 0) {
			const pathsToDelete = fileList.map(
				(file) => `${safeUserId}/${file.name}`,
			);

			const { error: storageError } = await supabase.storage
				.from("EvidenceVault")
				.remove(pathsToDelete);

			if (storageError) {
				console.warn(
					"[Evidence Service] Cloud storage asset cleanup skipped:",
					storageError.message,
				);
			} else {
				console.log(
					"[Evidence Service] Cloud storage file purges executed successfully.",
				);
			}
		}
	} catch (e) {
		console.error("Non-blocking cloud storage target file removal skipped:", e);
	}

	return {
		success: true,
		message: "Evidence deleted successfully.",
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
