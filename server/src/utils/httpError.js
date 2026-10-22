// Give every expected API error one status property for the error middleware.
const createHttpError = (message, statusCode) => {
	const error = new Error(message);
	error.statusCode = statusCode;
	error.expose = statusCode < 500 || statusCode === 503;
	return error;
};

module.exports = { createHttpError };
