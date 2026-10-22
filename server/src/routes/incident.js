const express = require("express");
const router = express.Router();

const incidentController = require("#controllers/incidentController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_INCIDENT_FIELDS = [
	"incident_id",
	"user_id",
	"trigger_type",
	"status",
	"start_time",
];

const REQUIRED_GET_INCIDENTS_FIELDS = ["user_id"];

router.post(
	"/add",
	validateBody(REQUIRED_INCIDENT_FIELDS),
	asyncHandler(incidentController.addOrUpdateIncident),
);

router.post(
	"/get-incidents",
	validateBody(REQUIRED_GET_INCIDENTS_FIELDS),
	asyncHandler(incidentController.getIncidents),
);

module.exports = router;
