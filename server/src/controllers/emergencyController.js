const emergencyService = require("#services/main/emergencyServiceServer.js");

const broadcastEmergency = async (req, res, next) => {
	try {
		const result = await emergencyService.handleEmergencyBroadcast(req.body);
		return res.status(200).json({
			success: true,
			message: "Emergency alerts broadcasted successfully",
			data: result,
		});
	} catch (error) {
		console.error("[Backend Emergency Broadcast Error]:", error);
		next(error);
	}
};

module.exports = {
	broadcastEmergency,
};
