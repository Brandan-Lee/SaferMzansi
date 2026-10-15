const evidenceModel = require("#models/evidenceModel.js");

const addEvidence = async (evidenceData) => {
    const { evidence_id } = evidenceData;

    const existingEvidence = await evidenceModel.findEvidenceById(evidence_id);

    if (existingEvidence) {
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
                "An evidence record with this ID has already been registered on the server.",
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

const deleteEvidence = async (evidenceId, userId) => {
    const existingEvidence = await evidenceModel.findEvidenceById(evidenceId);

    if (!existingEvidence) {
        const err = new Error("This evidence record does not exist");
        err.status = 404;
        throw err;
    }

    const deletedEvidence = await evidenceModel.deleteEvidence(evidenceId, userId);

    if (!deletedEvidence) {
        throw new Error("Failed to delete evidence record in database");
    }

    return deletedEvidence;
};

module.exports = {
    addEvidence,
    getEvidence,
    deleteEvidence,
};