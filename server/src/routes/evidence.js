const express = require("express");
const router = express.Router();

const evidenceController = require("#controllers/evidenceController.js");
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
    "/add",
    validateBody(REQUIRED_EVIDENCE_FIELDS),
    evidenceController.addEvidence,
);

router.post(
    "/get-evidence",
    validateBody(REQUIRED_GET_EVIDENCE_FIELDS),
    evidenceController.getEvidence,
);

router.post(
    "/delete",
    validateBody(REQUIRED_DELETE_EVIDENCE_FIELDS),
    evidenceController.deleteEvidence,
);

router.post(
    "/restore",
    validateBody(REQUIRED_DELETE_EVIDENCE_FIELDS),
    evidenceController.restoreEvidence,
);

router.post(
    "/permanent-delete",
    validateBody(REQUIRED_DELETE_EVIDENCE_FIELDS),
    evidenceController.permanentDeleteEvidence,
);

module.exports = router;