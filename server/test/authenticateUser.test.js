const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");

const authenticateUser = require("../src/middleware/authenticateUser");

test("authenticateUser requires the token to belong to the requested user", () => {
	const previousSecret = process.env.JWT_SECRET_KEY;
	process.env.JWT_SECRET_KEY = "test-jwt-secret";

	try {
		const token = jwt.sign(
			{ userId: "user-123" },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: "1h" },
		);
		let nextError = null;
		authenticateUser(
			{
				get: () => `Bearer ${token}`,
				params: { userId: "user-123" },
			},
			{},
			(error) => {
				nextError = error || null;
			},
		);
		assert.equal(nextError, null);

		authenticateUser(
			{
				get: () => `Bearer ${token}`,
				params: { userId: "another-user" },
			},
			{},
			(error) => {
				nextError = error;
			},
		);
		assert.equal(nextError.statusCode, 403);
	} finally {
		if (previousSecret === undefined) {
			delete process.env.JWT_SECRET_KEY;
		} else {
			process.env.JWT_SECRET_KEY = previousSecret;
		}
	}
});
