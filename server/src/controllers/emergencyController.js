const emergencyService = require("#services/main/emergencyServiceServer.js");

const broadcastEmergency = async (req, res) => {
	const result = await emergencyService.handleEmergencyBroadcast(req.body);
	return res.status(200).json({
		success: true,
		message: "Emergency alerts broadcasted successfully",
		data: result,
	});
};

module.exports = {
	broadcastEmergency,
};
