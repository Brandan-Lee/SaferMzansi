const notFoundHandler = (req, res) =>
	res.status(404).json({
		success: false,
		error: "The requested endpoint was not found.",
	});

module.exports = notFoundHandler;
