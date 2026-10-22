const express = require("express");
const router = express.Router();

const locationController = require("#controllers/incidentLocationController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
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
	validateBody(REQUIRED_LOCATION_FIELDS),
	asyncHandler(locationController.addLocation),
);

router.post(
	"/get-locations",
	validateBody(REQUIRED_GET_LOCATIONS_FIELDS),
	asyncHandler(locationController.getLocations),
);

router.post("/nearby-services", asyncHandler(locationController.getNearbyServices));

module.exports = router;
