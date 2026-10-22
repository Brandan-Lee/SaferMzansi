const authService = require("#services/auth/authServiceServer.js");

const serializeAuthUser = (user, includePasswordHash = false) => {
	const fields = [
		"user_id",
		"email_blind_index",
		"encrypted_name",
		"encrypted_surname",
		"encrypted_email",
		"encrypted_phone_num",
		"created_at",
		"updated_at",
		"deleted_at",
		"is_deleted",
		"is_verified",
	];

	// Registration returns the stored hash needed by the client; login omits it.
	if (includePasswordHash) fields.push("password_hash");

	return Object.fromEntries(fields.map((field) => [field, user[field]]));
};

const formatAuthSuccess = (
	res,
	statusCode,
	message,
	userId,
	encryptedEmail,
	token,
	extraData = {},
	includePasswordHash = false,
) => {
	return res.status(statusCode).json({
		message,
		token,
		user: {
			user_id: userId,
			email: encryptedEmail,
			...serializeAuthUser(extraData, includePasswordHash),
		},
	});
};

const register = async (req, res) => {
	try {
		const { user, token } = await authService.registerUser(req.body);
		return res.status(201).json({
			message: "User successfully registered and synched with database",
			token,
			user: serializeAuthUser(user, true),
		});
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

		const {
			user,
			contacts,
			evidence,
			incidents,
			incident_locations,
			token,
		} = result;

		return res.status(200).json({
			message: "Login Successful",
			token,
			user: serializeAuthUser(user),
			contacts: contacts || [],
			evidence: evidence || [],
			incidents: incidents || [],
			incident_locations: incident_locations || [],
		});
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
		const { user, token, resolvedUserId, passwordHash } =
			await authService.resetPassword(req.body);

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
				password_hash: passwordHash,
			},
			true,
		);
	} catch (error) {
		const knownErrors = {
			INVALID_TOKEN: {
				status: 400,
				message:
					"Unable to reset password. Please restart the password reset process.",
			},
			SAME_PASSWORD: {
				status: 400,
				message: "Cannot use the same password. Please choose a new password.",
			},
			MISSING_CREDENTIALS: {
				status: 500,
				message:
					"User record is missing password credentials. Please contact support.",
			},
		};
		const knownError = knownErrors[error.message];
		if (knownError) {
			return res.status(knownError.status).json({ error: knownError.message });
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
