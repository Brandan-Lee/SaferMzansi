const evidenceModel = require("#models/evidenceModel.js");
const { createHttpError } = require("#utils/httpError.js");

const ensureEvidenceExists = async (evidenceId) => {
	const evidence = await evidenceModel.findEvidenceById(evidenceId);
	if (!evidence) {
		throw createHttpError("This evidence record does not exist.", 404);
	}
	return evidence;
};

const executeEvidenceAction = async (evidenceId, userId, action, errorMessage) => {
	await ensureEvidenceExists(evidenceId);
	const result = await action(evidenceId, userId);
	if (!result) {
		throw new Error(errorMessage);
	}
	return result;
};

const addEvidence = async (evidenceData) => {
	const existing = await evidenceModel.findEvidenceById(evidenceData.evidence_id);
	if (existing) {
		throw createHttpError(
			"This evidence record already exists on the server.",
			400,
		);
	}

	try {
		const newEvidence = await evidenceModel.createEvidence(evidenceData);
		if (!newEvidence) {
			throw new Error("Failed to create evidence record in database.");
		}
		return newEvidence;
	} catch (error) {
		if (error.code === "23505") {
			throw createHttpError(
				"An evidence record with this ID has already been registered on the server.",
				409,
			);
		}
		throw error;
	}
};

const getEvidence = async (userId) => {
	if (!userId) {
		throw new Error("user_id is required to fetch evidence");
	}

	return evidenceModel.getEvidenceByUserId(userId);
};

const deleteEvidence = (evidenceId, userId) =>
	executeEvidenceAction(
		evidenceId,
		userId,
		evidenceModel.deleteEvidence,
		"Failed to move evidence record to recycle bin",
	);

const restoreEvidence = (evidenceId, userId) =>
	executeEvidenceAction(
		evidenceId,
		userId,
		evidenceModel.restoreEvidence,
		"Failed to restore evidence record",
	);

const permanentDeleteEvidence = (evidenceId, userId) =>
	evidenceModel.permanentDeleteEvidence(evidenceId, userId);

module.exports = {
    addEvidence,
    getEvidence,
    deleteEvidence,
    restoreEvidence,
    permanentDeleteEvidence,
};