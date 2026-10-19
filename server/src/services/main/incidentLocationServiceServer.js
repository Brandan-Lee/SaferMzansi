const locationModel = require("#models/incidentLocationModel.js");

const addLocation = async (locationData) => {
	const location = await locationModel.upsertLocation(locationData);
	if (!location) {
		throw new Error("Failed to save incident location record in database.");
	}
	return location;
};

const getLocations = async (incidentId) => {
	if (!incidentId) {
		throw new Error("incident_id is required to fetch locations");
	}

	const locationsList =
		await locationModel.getLocationsByIncidentId(incidentId);
	return locationsList || [];
};

module.exports = {
	addLocation,
	getLocations,
};
