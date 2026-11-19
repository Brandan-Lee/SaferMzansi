const express = require("express");

const router = express.Router();
const emergencyController = require("#controllers/emergencyController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
const authenticateUser = require("#middleware/authenticateUser.js");
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
	authenticateUser,
	validateBody(REQUIRED_BROADCAST_FIELDS),
	asyncHandler(emergencyController.broadcastEmergency),
);

module.exports = router;
