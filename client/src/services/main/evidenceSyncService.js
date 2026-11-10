import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";
import { Buffer } from "buffer";
import { postApi, postBinaryApi, safeApiCall } from "@services/ApiClient";
import {
	getPendingEvidence,
	markEvidenceAsSynched,
	updateEvidenceCloudFileUrl,
} from "@database/repositories/evidenceRepository";

const getRemoteEvidence = async (userId) => {
	const response = await safeApiCall(
		() => postApi("/evidence/get-evidence", { user_id: userId }),
		"Failed to confirm evidence on the server.",
	);
	const evidence = response.data?.data?.evidence || response.data?.evidence;
	return response.success && Array.isArray(evidence) ? evidence : null;
};

const uploadEvidenceFile = async (db, userId, item) => {
	if (item.cloud_file_url) return item.cloud_file_url;

	if (
		typeof item.local_file_url !== "string" ||
		!item.local_file_url.startsWith("file://") &&
			!item.local_file_url.startsWith("content://")
	) {
		throw new Error(`Evidence file is missing locally: ${item.evidence_id}`);
	}

	const file = new File(item.local_file_url);
	if (!file.exists) {
		throw new Error(`Evidence file is missing locally: ${item.evidence_id}`);
	}

	const fileContents = await FileSystem.readAsStringAsync(file.uri, {
		encoding: FileSystem.EncodingType.Base64,
	});

	const response = await postBinaryApi(
		`/evidence/upload/${encodeURIComponent(userId)}/${encodeURIComponent(item.evidence_id)}`,
		Buffer.from(fileContents, "base64"),
		{ fileType: item.file_type, fileName: file.name },
	);
	const path = response.data?.data?.path;
	if (!response.ok || !path) {
		throw new Error(
			`Cloud storage upload failed: ${
				response.data?.error || response.error || "The server returned no file path."
			}`,
		);
	}

	await updateEvidenceCloudFileUrl(db, item.evidence_id, path);
	return path;
};

const syncEvidenceMetadata = async (item, userId, cloudFileUrl) => {
	const result = await safeApiCall(
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
	if (result.success) return;

	const remoteEvidence = await getRemoteEvidence(userId);
	const alreadyExists = remoteEvidence.some(
		(remote) => (remote.evidence_id || remote.id) === item.evidence_id,
	);
	if (!alreadyExists) {
		throw new Error(result.error || "Evidence metadata sync failed.");
	}
};

export const syncEvidenceDeletion = async (item, userId) => {
	const result = await safeApiCall(
		() =>
			postApi("/evidence/delete", {
				evidence_id: item.evidence_id,
				user_id: userId,
			}),
		"Server failed to sync evidence deletion.",
	);
	if (result.success) return true;

	const remoteEvidence = await getRemoteEvidence(userId);
	if (!remoteEvidence) return false;
	const remoteItem = remoteEvidence.find(
		(remote) => (remote.evidence_id || remote.id) === item.evidence_id,
	);
	return (
		!remoteItem ||
		remoteItem.is_deleted === true ||
		remoteItem.is_deleted === 1 ||
		remoteItem.is_deleted === "true"
	);
};

const syncDeletedEvidence = async (item, userId) => {
	const deleted = await syncEvidenceDeletion(item, userId);
	if (!deleted) throw new Error("Evidence deletion sync failed.");
};

const syncActiveEvidence = async (item, userId, cloudFileUrl) => {
	const restoreResult = await safeApiCall(
		() =>
			postApi("/evidence/restore", {
				evidence_id: item.evidence_id,
				user_id: userId,
			}),
		"Server failed to restore evidence.",
	);
	if (restoreResult.success) return;

	await syncEvidenceMetadata(item, userId, cloudFileUrl);
	const remoteEvidence = await getRemoteEvidence(userId);
	const remoteItem = remoteEvidence.find(
		(remote) => (remote.evidence_id || remote.id) === item.evidence_id,
	);

	if (remoteItem?.is_deleted) {
		const result = await safeApiCall(
			() =>
				postApi("/evidence/restore", {
					evidence_id: item.evidence_id,
					user_id: userId,
				}),
			"Server failed to restore evidence.",
		);
		if (!result.success) {
			throw new Error(result.error || "Evidence restore failed.");
		}
	}
};

export const syncPendingEvidence = async (
	db,
	userId,
	onlyEvidenceId = null,
) => {
	const network = await NetInfo.fetch();
	if (!network.isConnected || network.isInternetReachable === false) return false;

	const pendingEvidence = await getPendingEvidence(db, userId);
	const items = onlyEvidenceId
		? pendingEvidence.filter((item) => item.evidence_id === onlyEvidenceId)
		: pendingEvidence;
	let allSynced = true;

	for (const item of items) {
		try {
			if (item.is_deleted) {
				await syncDeletedEvidence(item, userId);
			} else {
				const cloudFileUrl = await uploadEvidenceFile(db, userId, item);
				await syncActiveEvidence(item, userId, cloudFileUrl);
			}
			await markEvidenceAsSynched(db, item.evidence_id);
		} catch (error) {
			allSynced = false;
			console.warn(
				`[Evidence Sync] Evidence ${item.evidence_id} remains queued:`,
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
