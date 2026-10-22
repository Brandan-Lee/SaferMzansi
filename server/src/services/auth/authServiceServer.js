const contactModel = require("#models/contactModel.js");
const evidenceModel = require("#models/evidenceModel.js");
const locationModel = require("#models/incidentLocationModel.js");
const incidentModel = require("#models/incidentModel.js");
const userModel = require("#models/userModel.js");
const {
	queueOtpEmail,
	isPasswordResetTokenValid,
	consumePasswordResetToken,
} = require("#services/auth/otpServiceServer.js");
const { createHttpError } = require("#utils/httpError.js");
const { hashPassword, verifyPassword } = require("#utils/securityUtil.js");
const { generateToken } = require("#utils/tokenUtil.js");

const getIncidentLocations = async (incidents) => {
	if (!incidents.length) return [];

	const incidentIds = incidents.map((incident) => incident.incident_id);
	return locationModel.getLocationsByIncidentId(incidentIds);
};

const registerUser = async (userData) => {
	const existingUser = await userModel.findUserByEmailBlindIndex(
		userData.email_blind_index,
	);

	if (existingUser) {
		throw createHttpError("User already exists", 409);
	}

	const password_hash = await hashPassword(userData.password);
	const otherUserData = { ...userData };
	delete otherUserData.password;

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
	const user = await userModel.findUserByEmailBlindIndex(email_blind_index);

	if (!user) {
		return null;
	}

	const isPasswordValid = await verifyPassword(user.password_hash, password);

	if (!isPasswordValid || !user.is_verified) {
		return null;
	}

	// Reactivate account if the user deactivated it previously
	if (user.is_deleted) {
		const restoredUser = await userModel.restoreUserAccount(user.user_id);
		Object.assign(user, restoredUser);
	}

	const contacts = await contactModel.getEmergencyContacts(user.user_id);
	const evidence = await evidenceModel.getEvidenceByUserId(user.user_id);
	const incidents = await incidentModel.getIncidentsByUserId(user.user_id);
	const incidentList = incidents || [];
	const allLocations = await getIncidentLocations(incidentList);

	const safeUser = { ...user };
	delete safeUser.password_hash;
	const token = generateToken({
		userId: user.user_id,
		email: user.encrypted_email,
	});

	return {
		user: safeUser,
		contacts: contacts || [],
		evidence: evidence || [],
		incidents: incidentList,
		incident_locations: allLocations,
		token,
	};
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
		// Keep the public response identical whether or not the account exists.
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
		throw new Error("INVALID_TOKEN");
	}

	if (!user.password_hash) {
		throw new Error("MISSING_CREDENTIALS");
	}

	const isSamePassword = await verifyPassword(user.password_hash, password);

	if (isSamePassword) {
		throw new Error("SAME_PASSWORD");
	}

	const tokenConsumed = consumePasswordResetToken(reset_token, resolvedUserId);

	if (!tokenConsumed) {
		throw new Error("INVALID_TOKEN");
	}

	const hashedPassword = await hashPassword(password);
	const updateResult = await userModel.updateUserPassword(
		resolvedUserId,
		hashedPassword,
	);

	if (!updateResult) {
		throw new Error("Update failed");
	}

	const incidents = await incidentModel.getIncidentsByUserId(resolvedUserId);
	const incidentList = incidents || [];
	const allLocations = await getIncidentLocations(incidentList);

	const safeUser = { ...user };
	delete safeUser.password_hash;
	const token = generateToken({
		userId: resolvedUserId,
		email: user.encrypted_email,
	});

	return {
		user: safeUser,
		passwordHash: hashedPassword,
		incidents: incidentList,
		incident_locations: allLocations,
		token,
		resolvedUserId,
		message: "Password updated successfully",
	};
};

module.exports = {
	registerUser,
	authenticateUser,
	requestForgotPassword,
	resetPassword,
};
