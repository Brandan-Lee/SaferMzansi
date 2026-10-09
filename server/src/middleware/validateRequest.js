const validateBody = (requiredFields) => {
	return (req, res, next) => {
		console.log("Middleware Received Body:", req.body);
		const missingFields = requiredFields.filter((field) => !req.body?.[field]);

		if (missingFields.length > 0) {
			return res.status(400).json({
				error: `Missing required parameter(s): ${missingFields.join(", ")}`,
			});
		}

		next();
	};
};

module.exports = { validateBody };
