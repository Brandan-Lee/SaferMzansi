const evidenceService = require("#services/evidenceService.js");

const addEvidence = async (req, res, next) => {
    try {
        console.log("[Backend Evidence Body Received]:", req.body);
        const evidence = await evidenceService.addEvidence(req.body);
        return res.status(201).json({
            success: true,
            message: "Evidence record added successfully",
            data: evidence,
        });
    } catch (error) {
        console.error("[Backend Add Evidence Error]:", error);
        next(error);
    }
};

const getEvidence = async (req, res, next) => {
    try {
        const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;
        const evidenceList = await evidenceService.getEvidence(userId);

        return res.status(200).json({
            success: true,
            message: "Evidence records retrieved successfully",
            data: {
                evidence: evidenceList,
            },
        });
    } catch (error) {
        next(error);
    }
};

const deleteEvidence = async (req, res, next) => {
    try {
        const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;
        const evidenceId =
            req.body?.evidence_id || req.body?.evidenceId || req.query?.evidence_id;

        const evidence = await evidenceService.deleteEvidence(evidenceId, userId);

        return res.status(200).json({
            success: true,
            message: "Evidence deleted successfully",
            data: evidence,
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    addEvidence,
    getEvidence,
    deleteEvidence,
};