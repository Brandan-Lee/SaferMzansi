const jwt = require("jsonwebtoken");
const { createHttpError } = require("#utils/httpError.js");

const authenticateUser = (req, res, next) => {
	const authorization = req.get("authorization") || "";
	const [scheme, token] = authorization.split(" ");
	if (scheme !== "Bearer" || !token) {
		return next(createHttpError("Authentication is required.", 401));
	}

	if (!process.env.JWT_SECRET_KEY) {
		return next(new Error("JWT_SECRET_KEY must be configured."));
	}

	let payload;
	try {
		payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
	} catch {
		return next(createHttpError("The authentication token is invalid or expired.", 401));
	}

	if (
		!payload ||
		typeof payload !== "object" ||
		payload.userId !== req.params.userId
	) {
		return next(createHttpError("The authenticated user does not match the upload.", 403));
	}

	return next();
};

module.exports = authenticateUser;
