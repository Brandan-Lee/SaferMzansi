const RESPONSE_DEADLINE_MS = 3900;
const NEARBY_SERVICES_DEADLINE_MS = 8000;
const NEARBY_SERVICES_PATH = "/api/locations/nearby-services";
const EMERGENCY_BROADCAST_PATH = "/api/emergency/broadcast";

// Most requests should finish quickly; emergency broadcasts may wait for email delivery.
const requestDeadline = (req, res, next) => {
	if (req.method === "POST" && req.path === EMERGENCY_BROADCAST_PATH) {
		return next();
	}

	const responseDeadline =
		req.method === "POST" && req.path === NEARBY_SERVICES_PATH
			? NEARBY_SERVICES_DEADLINE_MS
			: RESPONSE_DEADLINE_MS;
	const deadline = setTimeout(() => {
		if (!res.headersSent) {
			res.status(504).json({
				success: false,
				error: "The request took too long. Please try again.",
			});
		}
	}, responseDeadline);

	// Clear the timer either way, so completed requests do not leave timers running.
	res.once("finish", () => clearTimeout(deadline));
	res.once("close", () => clearTimeout(deadline));
	next();
};

module.exports = requestDeadline;
