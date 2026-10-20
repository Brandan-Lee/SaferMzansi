const { supabase } = require("#config/supabase_db.js");

const TABLE_NAME = "Evidence_Vault";

const validateIds = (evidenceId, userId, actionName) => {
    if (!evidenceId || !userId) {
        throw new Error(`${actionName} requires both evidence_id and user_id`);
    }
    return {
        safeEvidenceId: String(evidenceId).trim(),
        safeUserId: String(userId).trim(),
    };
};

const updateEvidenceRecord = async (evidenceId, userId, updatePayload) => {
    const { safeEvidenceId, safeUserId } = validateIds(evidenceId, userId, "Update Evidence");

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .match({ evidence_id: safeEvidenceId, user_id: safeUserId })
        .select()
        .maybeSingle();

    if (error) throw error;
    return data;
};

const createEvidence = async (payload) => {
    const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== null && value !== undefined)
    );

    if (cleanPayload.is_deleted === 0 || cleanPayload.is_deleted === "0") cleanPayload.is_deleted = false;
    if (cleanPayload.is_deleted === 1 || cleanPayload.is_deleted === "1") cleanPayload.is_deleted = true;

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([cleanPayload])
        .select()
        .single();

    if (error) throw error;
    return data;
};

const findEvidenceById = async (evidenceId) => {
    if (!evidenceId) throw new Error("findEvidenceById requires a valid evidence_id");

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("evidence_id", String(evidenceId).trim())
        .maybeSingle();

    if (error) throw error;
    return data;
};

const getEvidenceByUserId = async (userId) => {
    if (!userId) throw new Error("getEvidenceByUserId requires a valid user_id");

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .match({ user_id: String(userId).trim() });

    if (error) throw error;
    return data || [];
};

const deleteEvidence = (evidenceId, userId) =>
    updateEvidenceRecord(evidenceId, userId, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
    });

const restoreEvidence = (evidenceId, userId) =>
    updateEvidenceRecord(evidenceId, userId, {
        is_deleted: false,
        deleted_at: null,
    });

const permanentDeleteEvidence = async (evidenceId, userId) => {
    const { safeEvidenceId, safeUserId } = validateIds(evidenceId, userId, "Permanent Delete Evidence");

    const { data: evidence, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select("cloud_file_url")
        .match({ evidence_id: safeEvidenceId, user_id: safeUserId })
        .maybeSingle();

    if (fetchError) throw fetchError;
    if (!evidence) return null;

    if (evidence.cloud_file_url) {
        await supabase.storage.from("EvidenceVault").remove([evidence.cloud_file_url]);
    }

    const { data, error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .match({ evidence_id: safeEvidenceId, user_id: safeUserId })
        .select()
        .maybeSingle();

    if (deleteError) throw deleteError;
    return data;
};

const purgeExpiredServerEvidence = async (userId) => {
    if (!userId) return;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredRecords, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .match({ user_id: String(userId).trim(), is_deleted: true })
        .lte("deleted_at", thirtyDaysAgo);

    if (error || !expiredRecords?.length) return;

    for (const record of expiredRecords) {
        if (record.cloud_file_url) {
            await supabase.storage.from("EvidenceVault").remove([record.cloud_file_url]);
        }
        await supabase.from(TABLE_NAME).delete().eq("evidence_id", record.evidence_id);
    }
};

module.exports = {
    createEvidence,
    findEvidenceById,
    getEvidenceByUserId,
    deleteEvidence,
    restoreEvidence,
    permanentDeleteEvidence,
    purgeExpiredServerEvidence,
};