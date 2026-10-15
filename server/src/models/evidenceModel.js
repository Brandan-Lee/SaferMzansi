const { supabase } = require("#config/supabase_db.js");

const createEvidence = async (payload) => {
    const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
            ([_, value]) => value !== null && value !== undefined,
        ),
    );

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

    const { data: evidence, error } = await supabase
        .from("Evidence_Vault")
        .select("*")
        .eq("evidence_id", evidenceId)
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

    const { data: evidenceList, error } = await supabase
        .from("Evidence_Vault")
        .select("*")
        .match({ user_id: userId, is_deleted: 0 });

    if (error) {
        throw error;
    }

    return evidenceList || [];
};

const deleteEvidence = async (evidenceId, userId) => {
    if (!evidenceId || !userId) {
        throw new Error("Delete Evidence requires both evidence_id and user_id");
    }

    const now = new Date().toISOString();

    const { data: evidence, error } = await supabase
        .from("Evidence_Vault")
        .update({
            is_deleted: 1,
            updated_at: now,
            deleted_at: now,
        })
        .match({ evidence_id: evidenceId, user_id: userId })
        .select()
        .maybeSingle();

    if (error) {
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