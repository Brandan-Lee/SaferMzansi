const express = require("express");

const router = express.Router();
const emergencyController = require("#controllers/emergencyController.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_BROADCAST_FIELDS = [
	"incident_id",
	"location_id",
	"user_id",
	"trigger_type",
	"status",
	"start_time",
	"location",
	"contacts",
	"message",
];

router.post(
	"/broadcast",
	validateBody(REQUIRED_BROADCAST_FIELDS),
	emergencyController.broadcastEmergency,
);

module.exports = router;
