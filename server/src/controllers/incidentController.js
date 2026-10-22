const incidentService = require("#services/main/incidentServiceServer.js");

const addOrUpdateIncident = async (req, res, next) => {
	try {
		const incident = await incidentService.addOrUpdateIncident(req.body);
		return res.status(200).json({
			success: true,
			message: "Incident record processed successfully",
			data: incident,
		});
	} catch (error) {
		console.error("[Backend Incident Error]:", error);
		next(error);
	}
};

const getIncidents = async (req, res, next) => {
	try {
		const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;
		const incidentsList = await incidentService.getIncidents(userId);

		return res.status(200).json({
			success: true,
			message: "Incidents retrieved successfully",
			data: {
				incidents: incidentsList,
			},
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	addOrUpdateIncident,
	getIncidents,
};
