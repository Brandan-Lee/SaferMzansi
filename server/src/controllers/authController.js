const authService = require("#services/auth/authService.js");

const formatAuthSuccess = (
	res,
	statusCode,
	message,
	userId,
	encryptedEmail,
	token,
	extraData = {},
) => {
	return res.status(statusCode).json({
		message,
		token,
		user: {
			user_id: userId,
			email: encryptedEmail,
			...extraData,
		},
	});
};

const register = async (req, res) => {
	try {
		const { user, token } = await authService.registerUser(req.body);
		return formatAuthSuccess(
			res,
			201,
			"User successfully registered and synched with database",
			user.user_id,
			user.encrypted_email,
			token,
		);
	} catch (error) {
		if (error.statusCode === 409 || error.code === "23505") {
			console.error("Error during register user:", error);
			return res.status(409).json({
				error: "User already exists in the system",
			});
		}
		console.error("Fatal exception during registration:", error);
		return res.status(500).json({ error: "Failed to register user" });
	}
};

const login = async (req, res) => {
	try {
		const result = await authService.authenticateUser(req.body);

		if (!result) {
			return res.status(401).json({
				ok: false,
				error: "Invalid credentials. Please try again",
			});
		}

		const { user, token } = result;
		const resolvedUserId = user.user_id;

		return formatAuthSuccess(
			res,
			200,
			"Login Successfull",
			resolvedUserId,
			user.encrypted_email,
			token,
			{
				user_id: resolvedUserId,
				email_blind_index: user.email_blind_index,
				encrypted_name: user.encrypted_name,
				encrypted_surname: user.encrypted_surname,
				encrypted_email: user.encrypted_email,
				encrypted_phone_num: user.encrypted_phone_num,
				created_at: user.created_at,
				updated_at: user.updated_at,
				deleted_at: user.deleted_at,
				is_deleted: user.is_deleted,
				is_verified: user.is_verified,
			},
		);
	} catch (error) {
		console.error("Error during login process:", error);
		return res.status(500).json({ error: "Failed to authenticate user" });
	}
};

const forgotPassword = async (req, res) => {
	const email =
		typeof req.body.email === "string"
			? req.body.email.trim().toLowerCase()
			: "";

	await authService.requestForgotPassword(email, req.body.email_blind_index);

	return res.status(200).json({
		success: true,
		message: "If an account exists, a verification code will be sent",
	});
};

const resetPassword = async (req, res) => {
	try {
		const { user, token, resolvedUserId } = await authService.resetPassword(
			req.body,
		);

		return formatAuthSuccess(
			res,
			200,
			"Password was successfully updated",
			resolvedUserId,
			user.encrypted_email,
			token,
			{
				user_id: resolvedUserId,
				email_blind_index: user.email_blind_index,
				encrypted_name: user.encrypted_name,
				encrypted_surname: user.encrypted_surname,
				encrypted_email: user.encrypted_email,
				encrypted_phone_num: user.encrypted_phone_num,
				created_at: user.created_at,
				updated_at: user.updated_at,
				deleted_at: user.deleted_at,
				is_deleted: user.is_deleted,
				is_verified: user.is_verified,
			},
		);
	} catch (error) {
		if (error.message === "INVALID_TOKEN") {
			return res.status(400).json({
				error:
					"Unable to reset password. Please restart the password reset process.",
			});
		}
		if (error.message === "SAME_PASSWORD") {
			return res.status(400).json({
				error: "Cannot use the same password. Please choose a new password.",
			});
		}
		if (error.message === "MISSING_CREDENTIALS") {
			return res.status(500).json({
				error:
					"User record is missing password credentials. Please contact support.",
			});
		}
		console.error("Fatal exception during reset password:", error);
		return res.status(500).json({ error: "Failed to reset password request" });
	}
};

module.exports = {
	register,
	login,
	forgotPassword,
	resetPassword,
};