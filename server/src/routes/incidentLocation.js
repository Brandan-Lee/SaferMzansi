const express = require("express");
const router = express.Router();

const locationController = require("#controllers/incidentLocationController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
const authenticateUser = require("#middleware/authenticateUser.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_LOCATION_FIELDS = [
	"location_id",
	"incident_id",
	"latitude",
	"longitude",
];

const REQUIRED_GET_LOCATIONS_FIELDS = ["incident_id"];

router.post(
	"/add",
	authenticateUser,
	validateBody(REQUIRED_LOCATION_FIELDS),
	asyncHandler(locationController.addLocation),
);

router.post(
	"/get-locations",
	authenticateUser,
	validateBody(REQUIRED_GET_LOCATIONS_FIELDS),
	asyncHandler(locationController.getLocations),
);

router.post("/nearby-services", asyncHandler(locationController.getNearbyServices));

module.exports = router;
