const express = require("express");
const router = express.Router();

const locationController = require("#controllers/incidentLocationController.js");
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
	locationController.addLocation,
);

router.post(
	"/get-locations",
	validateBody(REQUIRED_GET_LOCATIONS_FIELDS),
	locationController.getLocations,
);

module.exports = router;
