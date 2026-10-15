import * as Crypto from "expo-crypto";
import { supabase } from "@config/supabase_client";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
    insertLocalEvidence,
    softDeleteLocalEvidence,
    getLocalEvidenceGroupedByDate,
    getLocalEvidenceTotal as repoGetTotal,
} from "@database/repositories/evidenceRepository";

const validateRequired = (fields, errorMessage) => {
    if (fields.some((field) => !field && field !== 0)) {
        throw new Error(errorMessage);
    }
};

export const getEvidence = async (db, userId, options = {}) => {
    validateRequired([userId], "User ID is required to fetch evidence.");

    try {
        const groupedData = options.grouped ? await getLocalEvidenceGroupedByDate(db, userId) : [];
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

    const { file_type, local_file_url, sha256_hash, file_size, file_name } = evidenceData;
    validateRequired([file_type, local_file_url, sha256_hash, file_size], "Missing required evidence fields.");

    const evidenceId = Crypto.randomUUID();
    const safeFileName = file_name || local_file_url?.split("/").pop() || "evidence_file";
    const storagePath = `${userId}/${evidenceId}_${safeFileName}`;

    try {
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

        // Save metadata locally to SQLite
        await insertLocalEvidence(db, {
            evidenceId,
            userId,
            fileType: file_type,
            localFileUrl: local_file_url,
            sha256Hash: sha256_hash,
            fileSize: file_size,
        });

        // Send payload to backend server
        const apiPayload = {
            evidence_id: evidenceId,
            user_id: userId,
            file_type: file_type,
            cloud_file_url: cloudFileUrl,
            sha256_hash: sha256_hash,
            file_size: file_size,
        };

        const result = await safeApiCall(
            () => postApi("/evidence/add", apiPayload),
            "Server failed to save evidence metadata. Saved locally for offline sync.",
        );

        if (!result?.success) {
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

export const deleteEvidence = async (db, evidenceId, userId) => {
    validateRequired([userId, evidenceId], "User ID and Evidence ID are required to delete evidence.");

    const apiPayload = { evidence_id: evidenceId, user_id: userId };

    const result = await safeApiCall(
        () => postApi("/evidence/delete", apiPayload),
        "Server failed to delete evidence.",
    );

    if (!result?.success) {
        console.warn("[Evidence Service] Backend deletion failed, proceeding with local soft delete.");
    }

    try {
        await softDeleteLocalEvidence(db, userId, evidenceId);
    } catch (error) {
        console.error("[Evidence Service] Failed to delete evidence locally:", error);
        throw new Error("Failed to delete evidence locally.");
    }

    return {
        success: true,
        message: "Evidence deleted successfully.",
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