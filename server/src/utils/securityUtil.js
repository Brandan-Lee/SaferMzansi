const argon2 = require("argon2");

const ARGON2_OPTIONS = {
	type: argon2.argon2id,
	memoryCost: 2 ** 16,
	timeCost: 3,
	parallelism: 1,
};

// Argon2id is the password storage format used for server authentication.
const hashPassword = async (plainPassword) => {
	try {
		return await argon2.hash(plainPassword, ARGON2_OPTIONS);
	} catch (error) {
		console.error("Error hashing password with Argon2id:", error);
		throw new Error("Password processing failed");
	}
};

const verifyPassword = async (storedHash, plainPassword) => {
	if (!storedHash || !plainPassword) return false;

	try {
		return await argon2.verify(storedHash, plainPassword);
	} catch {
		return false;
	}
};

module.exports = { hashPassword, verifyPassword };