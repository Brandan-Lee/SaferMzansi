const locationService = require("#services/main/incidentLocationServiceServer.js");
const nearbyServicesService = require("#services/main/nearbyServicesServiceServer.js");

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
		console.error("[Nearby services] Lookup failed:", error);
		next(error);
	}
};

const getNearbyServices = async (req, res, next) => {
	try {
		const { latitude, longitude } = req.body || {};
		if (
			!Number.isFinite(latitude) ||
			!Number.isFinite(longitude) ||
			latitude < -90 ||
			latitude > 90 ||
			longitude < -180 ||
			longitude > 180
		) {
			return res.status(400).json({
				success: false,
				error: "Valid latitude and longitude are required.",
			});
		}

		const services = await nearbyServicesService.getNearbyServices(
			latitude,
			longitude,
		);
		return res.status(200).json({
			success: true,
			data: { services },
		});
	} catch (error) {
		next(error);
	}
};

module.exports = { addLocation, getLocations, getNearbyServices };
