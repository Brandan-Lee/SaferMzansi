const { supabase } = require("#config/supabase_db.js");
const { omitNullish } = require("#utils/databaseUtil.js");

const TABLE_NAME = "Evidence_Vault";
const STORAGE_BUCKET = "EvidenceVault";
const STORAGE_PAGE_SIZE = 100;
const STORAGE_REMOVE_BATCH_SIZE = 100;

const validateIds = (evidenceId, userId, actionName) => {
    if (!evidenceId || !userId) {
        throw new Error(`${actionName} requires both evidence_id and user_id`);
    }
    return {
        safeEvidenceId: String(evidenceId).trim(),
        safeUserId: String(userId).trim(),
    };
};

const listStoragePaths = async (folderPath, evidenceId = null) => {
    const paths = [];
    let offset = 0;
    let hasMoreEntries = true;

    while (hasMoreEntries) {
        const { data: entries, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(folderPath, {
                limit: STORAGE_PAGE_SIZE,
                offset,
                ...(evidenceId ? { search: evidenceId } : {}),
            });

        if (error) throw error;
        if (!entries?.length) {
            hasMoreEntries = false;
            continue;
        }

        for (const entry of entries) {
            const entryPath = folderPath
                ? `${folderPath}/${entry.name}`
                : entry.name;
            if (entry.id || entry.metadata) {
                paths.push(entryPath);
            } else {
                paths.push(
                    ...(await listStoragePaths(entryPath, evidenceId)),
                );
            }
        }

        hasMoreEntries = entries.length === STORAGE_PAGE_SIZE;
        offset += entries.length;
    }

    return paths;
};

const removeStoragePaths = async (paths) => {
    for (
        let offset = 0;
        offset < paths.length;
        offset += STORAGE_REMOVE_BATCH_SIZE
    ) {
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(paths.slice(offset, offset + STORAGE_REMOVE_BATCH_SIZE));
        if (error) throw error;
    }
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
    const cleanPayload = omitNullish(payload);

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

    const storagePaths = new Set(
        await listStoragePaths(safeUserId, safeEvidenceId),
    );
    if (evidence.cloud_file_url) {
        storagePaths.add(evidence.cloud_file_url);
    }
    await removeStoragePaths([...storagePaths]);

    if (!evidence) return { evidence_id: safeEvidenceId, user_id: safeUserId };

    const { data, error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .match({ evidence_id: safeEvidenceId, user_id: safeUserId })
        .select()
        .maybeSingle();
    if (deleteError) throw deleteError;
    return data;
};

const permanentDeleteEvidenceForUser = async (userId) => {
    if (!userId) {
        throw new Error("A user ID is required to remove account evidence.");
    }

    const safeUserId = String(userId).trim();
    const { data: evidence, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select("cloud_file_url")
        .eq("user_id", safeUserId);

    if (fetchError) throw fetchError;

    const storagePaths = new Set(
        (evidence || [])
            .map((item) => item.cloud_file_url)
            .filter(Boolean),
    );
    (await listStoragePaths(safeUserId)).forEach((path) =>
        storagePaths.add(path),
    );
    await removeStoragePaths([...storagePaths]);

    const { error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq("user_id", safeUserId);
    if (deleteError) throw deleteError;

    return { deletedCount: evidence?.length || 0 };
};

const purgeExpiredServerEvidence = async (userId) => {
    if (!userId) return;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredRecords, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .match({ user_id: String(userId).trim(), is_deleted: true })
        .lte("deleted_at", thirtyDaysAgo);

    if (error) throw error;
    if (!expiredRecords?.length) return;

    for (const record of expiredRecords) {
        if (record.cloud_file_url) {
            const { error: storageError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .remove([record.cloud_file_url]);
            if (storageError) throw storageError;
        }
        const { error: deleteError } = await supabase
            .from(TABLE_NAME)
            .delete()
            .match({ evidence_id: record.evidence_id, user_id: String(userId).trim() });
        if (deleteError) throw deleteError;
    }
};

module.exports = {
    createEvidence,
    findEvidenceById,
    getEvidenceByUserId,
    deleteEvidence,
    restoreEvidence,
    permanentDeleteEvidence,
    permanentDeleteEvidenceForUser,
    purgeExpiredServerEvidence,
};