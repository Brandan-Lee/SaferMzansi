const locationService = require("#services/main/incidentLocationServiceServer.js");

const addLocation = async (req, res, next) => {
	try {
		const location = await locationService.addLocation(req.body);
		return res.status(201).json({
			success: true,
			message: "Incident location added successfully",
			data: location,
		});
	} catch (error) {
		next(error);
	}
};

const getLocations = async (req, res, next) => {
	try {
		const incidentId = req.body?.incident_id || req.query?.incident_id;
		const locations = await locationService.getLocations(incidentId);
		return res.status(200).json({
			success: true,
			message: "Incident locations retrieved successfully",
			data: { locations },
		});
	} catch (error) {
		next(error);
	}
};

module.exports = { addLocation, getLocations };
