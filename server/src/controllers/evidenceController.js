const evidenceService = require("#services/main/evidenceServiceServer.js");

const extractParams = (req) => ({
	userId: req.body?.user_id,
	evidenceId: req.body?.evidence_id,
});

const sendResponse = (res, statusCode, message, data = null) => {
	return res.status(statusCode).json({
		success: true,
		message,
		data,
	});
};

const addEvidence = async (req, res) => {
	const evidence = await evidenceService.addEvidence(req.body);
	return sendResponse(res, 201, "Evidence record added successfully", evidence);
};

const getEvidence = async (req, res) => {
	const { userId } = extractParams(req);
	const evidenceList = await evidenceService.getEvidence(userId);
	return sendResponse(res, 200, "Evidence records retrieved successfully", {
		evidence: evidenceList,
	});
};

const deleteEvidence = async (req, res) => {
	const { evidenceId, userId } = extractParams(req);
	const evidence = await evidenceService.deleteEvidence(evidenceId, userId);
	return sendResponse(
		res,
		200,
		"Evidence moved to recycle bin successfully",
		evidence,
	);
};

const restoreEvidence = async (req, res) => {
	const { evidenceId, userId } = extractParams(req);
	const evidence = await evidenceService.restoreEvidence(evidenceId, userId);
	return sendResponse(res, 200, "Evidence restored successfully", evidence);
};

const permanentDeleteEvidence = async (req, res) => {
	const { evidenceId, userId } = extractParams(req);
	const evidence = await evidenceService.permanentDeleteEvidence(evidenceId, userId);
	return sendResponse(res, 200, "Evidence media file permanently deleted", evidence);
};

module.exports = {
    addEvidence,
    getEvidence,
    deleteEvidence,
    restoreEvidence,
    permanentDeleteEvidence,
};