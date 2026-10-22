// Keep server errors in one response shape and let Express handle sent responses.
const errorHandler = (err, req, res, next) => {
	if (res.headersSent) return next(err);

	const statusCode = err.status || err.statusCode || 500;
	if (statusCode >= 500) {
		console.error("[Server Error]", err);
	}

	return res.status(statusCode).json({
		success: false,
		error: err.expose
			? err.message
			: statusCode >= 500
				? "An unexpected server error occurred."
				: err.message || "The request could not be completed.",
	});
};

module.exports = errorHandler;
