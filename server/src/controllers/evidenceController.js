const evidenceService = require("#services/main/evidenceServiceServer.js");

//Helper to get user and evidence id
const extractParams = (req) => ({
    userId: req.body?.user_id,
    evidenceId: req.body?.evidence_id,
});

//Helper for sending consistent success responses
const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const addEvidence = async (req, res, next) => {
    try {
        const evidence = await evidenceService.addEvidence(req.body);
        return sendResponse(res, 201, "Evidence record added successfully", evidence);
    } catch (error) {
        console.error("[Backend Add Evidence Error]:", error);
        next(error);
    }
};

const getEvidence = async (req, res, next) => {
    try {
        const { userId } = extractParams(req);
        const evidenceList = await evidenceService.getEvidence(userId);
        return sendResponse(res, 200, "Evidence records retrieved successfully", { evidence: evidenceList });
    } catch (error) {
        next(error);
    }
};

const deleteEvidence = async (req, res, next) => {
    try {
        const { evidenceId, userId } = extractParams(req);
        const evidence = await evidenceService.deleteEvidence(evidenceId, userId);
        return sendResponse(res, 200, "Evidence moved to recycle bin successfully", evidence);
    } catch (error) {
        next(error);
    }
};

const restoreEvidence = async (req, res, next) => {
    try {
        const { evidenceId, userId } = extractParams(req);
        const evidence = await evidenceService.restoreEvidence(evidenceId, userId);
        return sendResponse(res, 200, "Evidence restored successfully", evidence);
    } catch (error) {
        next(error);
    }
};

const permanentDeleteEvidence = async (req, res, next) => {
    try {
        const { evidenceId, userId } = extractParams(req);
        const evidence = await evidenceService.permanentDeleteEvidence(evidenceId, userId);
        return sendResponse(res, 200, "Evidence media file permanently deleted", evidence);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addEvidence,
    getEvidence,
    deleteEvidence,
    restoreEvidence,
    permanentDeleteEvidence,
};