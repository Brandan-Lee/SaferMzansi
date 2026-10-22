const incidentService = require("#services/main/incidentServiceServer.js");

const addOrUpdateIncident = async (req, res) => {
	const incident = await incidentService.addOrUpdateIncident(req.body);
	return res.status(200).json({
		success: true,
		message: "Incident record processed successfully",
		data: incident,
	});
};

const getIncidents = async (req, res) => {
	const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;
	const incidentsList = await incidentService.getIncidents(userId);

	return res.status(200).json({
		success: true,
		message: "Incidents retrieved successfully",
		data: { incidents: incidentsList },
	});
};

module.exports = {
	addOrUpdateIncident,
	getIncidents,
};
