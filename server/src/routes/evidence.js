const express = require("express");
const router = express.Router();

const evidenceController = require("#controllers/evidenceController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
const authenticateUser = require("#middleware/authenticateUser.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_EVIDENCE_FIELDS = [
    "evidence_id",
    "user_id",
    "file_type",
    "cloud_file_url",
    "sha256_hash",
    "file_size",
];

const REQUIRED_GET_EVIDENCE_FIELDS = ["user_id"];
const REQUIRED_DELETE_EVIDENCE_FIELDS = ["evidence_id", "user_id"];

router.post(
    "/upload/:userId/:evidenceId",
    authenticateUser,
    express.raw({ type: "application/octet-stream", limit: "50mb" }),
    asyncHandler(evidenceController.uploadEvidenceFile),
);

router.post(
    "/add",
    authenticateUser,
    validateBody(REQUIRED_EVIDENCE_FIELDS),
    asyncHandler(evidenceController.addEvidence),
);

router.post(
    "/get-evidence",
    authenticateUser,
    validateBody(REQUIRED_GET_EVIDENCE_FIELDS),
    asyncHandler(evidenceController.getEvidence),
);

router.post(
    "/delete",
    authenticateUser,
    validateBody(REQUIRED_DELETE_EVIDENCE_FIELDS),
    asyncHandler(evidenceController.deleteEvidence),
);

router.post(
    "/restore",
    authenticateUser,
    validateBody(REQUIRED_DELETE_EVIDENCE_FIELDS),
    asyncHandler(evidenceController.restoreEvidence),
);

router.post(
    "/permanent-delete",
    authenticateUser,
    validateBody(REQUIRED_DELETE_EVIDENCE_FIELDS),
    asyncHandler(evidenceController.permanentDeleteEvidence),
);

module.exports = router;