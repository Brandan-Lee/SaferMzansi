const evidenceModel = require("#models/evidenceModel.js");

const ensureEvidenceExists = async (evidenceId) => {
    const evidence = await evidenceModel.findEvidenceById(evidenceId);
    if (!evidence) {
        const err = new Error("This evidence record does not exist");
        err.status = 404;
        throw err;
    }
    return evidence;
};

const executeEvidenceAction = async (evidenceId, userId, actionFn, errorMsg) => {
    await ensureEvidenceExists(evidenceId);
    const result = await actionFn(evidenceId, userId);
    if (!result) {
        throw new Error(errorMsg);
    }
    return result;
};

const addEvidence = async (evidenceData) => {
    const existing = await evidenceModel.findEvidenceById(evidenceData.evidence_id);
    if (existing) {
        const err = new Error("This evidence record already exists on the server.");
        err.status = 400;
        throw err;
    }

    try {
        const newEvidence = await evidenceModel.createEvidence(evidenceData);
        if (!newEvidence) {
            throw new Error("Failed to create evidence record in database.");
        }
        return newEvidence;
    } catch (error) {
        if (error.code === "23505") {
            const duplicateErr = new Error(
                "An evidence record with this ID has already been registered on the server."
            );
            duplicateErr.status = 409;
            throw duplicateErr;
        }
        throw error;
    }
};

const getEvidence = async (userId) => {
    if (!userId) {
        throw new Error("user_id is required to fetch evidence");
    }

    const evidenceList = await evidenceModel.getEvidenceByUserId(userId);
    if (!evidenceList) {
        throw new Error("Failed to retrieve evidence records from database");
    }

    return evidenceList;
};

const deleteEvidence = (evidenceId, userId) =>
    executeEvidenceAction(
        evidenceId,
        userId,
        evidenceModel.deleteEvidence,
        "Failed to move evidence record to recycle bin"
    );

const restoreEvidence = (evidenceId, userId) =>
    executeEvidenceAction(
        evidenceId,
        userId,
        evidenceModel.restoreEvidence,
        "Failed to restore evidence record"
    );

const permanentDeleteEvidence = (evidenceId, userId) =>
    executeEvidenceAction(
        evidenceId,
        userId,
        evidenceModel.permanentDeleteEvidence,
        "Failed to clear evidence media file reference"
    );

module.exports = {
    addEvidence,
    getEvidence,
    deleteEvidence,
    restoreEvidence,
    permanentDeleteEvidence,
};