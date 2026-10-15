const { supabase } = require("#config/supabase_db.js");

const createEvidence = async (payload) => {
    const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
            ([_, value]) => value !== null && value !== undefined,
        ),
    );

    if (cleanPayload.is_deleted === 0 || cleanPayload.is_deleted === '0') cleanPayload.is_deleted = false;
    if (cleanPayload.is_deleted === 1 || cleanPayload.is_deleted === '1') cleanPayload.is_deleted = true;

    const { data, error } = await supabase
        .from("Evidence_Vault")
        .insert([cleanPayload])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
};

const findEvidenceById = async (evidenceId) => {
    if (!evidenceId) {
        throw new Error("findEvidenceById requires a valid evidence_id");
    }

    const safeEvidenceId = String(evidenceId).trim();

    const { data: evidence, error } = await supabase
        .from("Evidence_Vault")
        .select("*")
        .eq("evidence_id", safeEvidenceId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return evidence;
};

const getEvidenceByUserId = async (userId) => {
    if (!userId) {
        throw new Error("getEvidenceByUserId requires a valid user_id");
    }

    const safeUserId = String(userId).trim();

    const { data: evidenceList, error } = await supabase
        .from("Evidence_Vault")
        .select("*")
        .match({ user_id: safeUserId, is_deleted: false });

    if (error) {
        throw error;
    }

    return evidenceList || [];
};

const deleteEvidence = async (evidenceId, userId) => {
    if (!evidenceId || !userId) {
        throw new Error("Delete Evidence requires both evidence_id and user_id");
    }

    const safeEvidenceId = String(evidenceId).trim();
    const safeUserId = String(userId).trim();
    const now = new Date().toISOString();

    console.log(`[Backend Model] Executing soft delete query row check for id: ${safeEvidenceId}`);

    const { data: evidence, error } = await supabase
        .from("Evidence_Vault")
        .update({
            is_deleted: true,
            uploaded_at: now,
            deleted_at: now,
        })
        .match({ evidence_id: safeEvidenceId, user_id: safeUserId })
        .select()
        .maybeSingle();

    if (error) {
        console.error("[Backend Model Error]: database execution failure:", error.message);
        throw error;
    }

    return evidence;
};


module.exports = {
    createEvidence,
    findEvidenceById,
    getEvidenceByUserId,
    deleteEvidence,
};
