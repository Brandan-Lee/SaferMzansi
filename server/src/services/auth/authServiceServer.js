// authService_2.js
const contactModel = require("#models/contactModel.js");
const userModel = require("#models/userModel.js");
const {
	queueOtpEmail,
	isPasswordResetTokenValid,
	consumePasswordResetToken,
} = require("#services/auth/otpServiceServer.js");
const { hashPassword, verifyPassword } = require("#utils/securityUtil.js");
const { generateToken } = require("#utils/tokenUtil.js");

const registerUser = async (userData) => {
	const existingUser = await userModel.findUserByEmailBlindIndex(
		userData.email_blind_index,
	);

	if (existingUser) {
		const error = new Error("User already exists");
		error.statusCode = 409;
		throw error;
	}

	const password_hash = await hashPassword(userData.password);
	const { password, ...otherUserData } = userData;

	const newUser = await userModel.createUser({
		...otherUserData,
		password_hash,
	});

	if (!newUser) {
		throw new Error("Failed to create user in database");
	}

	const updatedUser = await userModel.updateUserVerification(newUser.user_id);

	if (!updatedUser) {
		throw new Error("Failed to set user verification state");
	}

	const token = generateToken({
		userId: newUser.user_id,
		email: newUser.encrypted_email,
	});

	return { user: newUser, token };
};

const authenticateUser = async ({ email_blind_index, password }) => {
	// Added missing await on findUserByEmailBlindIndex
	const user = await userModel.findUserByEmailBlindIndex(email_blind_index);
	const contacts = await contactModel.getEmergencyContacts(user.user_id);

	if (!user) {
		return null;
	}

	const isPasswordValid = await verifyPassword(user.password_hash, password);

	if (!isPasswordValid || !user.is_verified) {
		return null;
	}

	const { password_hash, ...safeUser } = user;
	const token = generateToken({
		userId: user.user_id,
		email: user.encrypted_email,
	});

	return { user: safeUser, contacts, token };
};

const requestForgotPassword = async (email, email_blind_index) => {
	const startedAt = Date.now();
	const MIN_RESPONSE_MS = 1000;

	try {
		if (email && email_blind_index) {
			const user = await userModel.findUserByEmailBlindIndex(email_blind_index);

			if (user) {
				const resolvedUserId = user.user_id;
				await queueOtpEmail(email, resolvedUserId);
			}
		}
	} catch (error) {
		console.error("[Forgot Password Service] Error:", error);
	} finally {
		const elapsed = Date.now() - startedAt;

		if (elapsed < MIN_RESPONSE_MS) {
			await new Promise((res) => setTimeout(res, MIN_RESPONSE_MS - elapsed));
		}
	}
};

const resetPassword = async ({ email_blind_index, password, reset_token }) => {
	const user = await userModel.findUserByEmailBlindIndex(email_blind_index);

	if (!user) {
		throw new Error("User not found");
	}

	const resolvedUserId = user.user_id;
	const isValid = isPasswordResetTokenValid(reset_token, resolvedUserId);

	if (!isValid) {
		throw new Error("Invalid Token");
	}

	if (!user.password_hash) {
		throw new Error("Missing Credentials (password)");
	}

	const isSamePassword = await verifyPassword(user.password_hash, password);

	if (isSamePassword) {
		throw new Error("SAME_PASSWORD");
	}

	const tokenConsumed = consumePasswordResetToken(reset_token, resolvedUserId);

	if (!tokenConsumed) {
		throw new Error("Invalid token");
	}

	const hashedPassword = await hashPassword(password);
	const updateResult = await userModel.updateUserPassword(
		resolvedUserId,
		hashedPassword,
	);

	if (!updateResult) {
		throw new Error("Update failed");
	}

	const token = generateToken({
		userId: resolvedUserId,
		email: user.encrypted_email,
	});

	return { user, token, resolvedUserId };
};

module.exports = {
	registerUser,
	authenticateUser,
	requestForgotPassword,
	resetPassword,
};
