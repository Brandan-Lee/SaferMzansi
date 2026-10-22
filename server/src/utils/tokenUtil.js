const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
	const secret = process.env.JWT_SECRET_KEY;
	if (!secret) {
		throw new Error("JWT_SECRET_KEY must be configured.");
	}

	return jwt.sign(payload, secret, { expiresIn: "7d" });
};

module.exports = { generateToken };
