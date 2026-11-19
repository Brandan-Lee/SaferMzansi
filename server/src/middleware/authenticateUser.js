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

	if (!payload || typeof payload !== "object" || !payload.userId) {
		return next(createHttpError("The authentication token is invalid.", 401));
	}

	const requestedUserId =
		req.params?.userId ||
		req.params?.user_id ||
		req.body?.user_id;
	if (requestedUserId && payload.userId !== String(requestedUserId).trim()) {
		return next(createHttpError("The authenticated user does not match the requested resource.", 403));
	}

	req.auth = { userId: payload.userId };

	return next();
};

module.exports = authenticateUser;
