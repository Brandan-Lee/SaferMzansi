const incidentModel = require("#models/incidentModel.js");

const addOrUpdateIncident = async (incidentData) => {
	const incident = await incidentModel.insertIncident(incidentData);
	if (!incident) {
		throw new Error("Failed to save incident record in database.");
	}
	return incident;
};

const getIncidents = async (userId) => {
	if (!userId) {
		throw new Error("user_id is required to fetch incidents");
	}

	const incidentsList = await incidentModel.getIncidentsByUserId(userId);
	return incidentsList || [];
};

module.exports = {
	addOrUpdateIncident,
	getIncidents,
};
