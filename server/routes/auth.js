const express = require("express");
const router = express.Router();
const { validateBody } = require("../middleware/ValidateRequest");
const { generateToken } = require("../services/AuthService");
const {
	createUserInSupabase,
	verifyUserInSupabase,
	findUserInSupabase,
	updateUserVerificationInSupabase,
	updatePasswordInSupabase,
	findPasswordResetUserInSupabase,
	findUserByEmailBlindIndexInSupabase,
} = require("../services/UserService");
const { hashPassword, verifyPassword } = require("../utils/SecurityUtil");
const {
	queueOtpEmail,
	isPasswordResetTokenValid,
	consumePasswordResetToken,
} = require("../services/OtpService");

const REQUIRED_REGISTRATION_FIELDS = [
	"user_id",
	"email_blind_index",
	"encrypted_name",
	"encrypted_surname",
	"encrypted_email",
	"encrypted_phone_num",
	"password",
];

const REQUIRED_LOGIN_FIELDS = ["email_blind_index", "password"];
const REQUIRED_FORGOT_PASSWORD_FIELDS = ["email_blind_index", "email"];
const REQUIRED_RESET_PASSWORD_FIELDS = ["email_blind_index", "password", "reset_token"];
const PASSWORD_RESET_MIN_RESPONSE_MS = 1000;
const PASSWORD_RESET_LOOKUP_FALLBACK_ID =
	"00000000-0000-0000-0000-000000000000";

//Helper method to standardize the generation of tokens and the success response
const handleAuthSuccess = (
	res,
	statusCode,
	message,
	userId,
	encryptedEmail,
	userData = {}
) => {
	const token = generateToken({ userId, email: encryptedEmail });

	return res.status(statusCode).json({
		message,
		token,
		user: {
			user_id: userId,
			email: encryptedEmail,
			...userData,
		},
	});
};

//Helper method to standardize error response
const handleError = (res, error, actionMessage) => {
	console.error(`Error during ${actionMessage}`, error);

	if (error.code === "23505") {
		return res.status(409).json({
			error: "User already exists in the database",
		});
	}

	return res.status(500).json({
		error: `Failed to ${actionMessage}`,
	});
};

// Helper method to standardize success responses
const handleSuccess = (res, statusCode = 200, message) => {
	const response = {
		success: true,
		message,
	};

	return res.status(statusCode).json(response);
};

//Post call to register the user
router.post(
	"/register",
	validateBody(REQUIRED_REGISTRATION_FIELDS),
	async (req, res) => {
		try {
			//fields that is needed to update supabase table
			const { user_id, email_blind_index, encrypted_email } = req.body;

			// //Look if the user already exists on the supabase
			const user = await findUserByEmailBlindIndexInSupabase(email_blind_index);

			if (user) {
				return handleError(res, new Error("User already exists on supabase"), "Register. User already exists on the system");
			}

			//Save the data to the Supabase User Table
			await createUserInSupabase(req.body);

			//OTP verification has passed
			// TODO: Make use of one function to update the user verification status in Supabase instead of having two separate functions for registration and verification
			const updatedUser = await updateUserVerificationInSupabase(user_id);

			if (!updatedUser) {
				return handleError(
					res,
					new Error("User record not found or update returned no data."),
					"Update user data. User record not found or update returned no data.",
				);
			}

			return handleAuthSuccess(
				res,
				201,
				"User successfully registered and synched with database",
				user_id,
				encrypted_email,
			);
		} catch (error) {
			return handleError(res, error, "register user");
		}
	},
);

// Post call to login the user and verify their credentials
router.post("/login", validateBody(REQUIRED_LOGIN_FIELDS), async (req, res) => {
	try {
		const { email_blind_index, password } = req.body;

		// Verify the user credentials against the data stored in supabase
		const user = await verifyUserInSupabase({ email_blind_index, password });

		// Users credentials are wrong or doesn't exist
		if (!user) {
			return res.status(401).json({ 
				ok: false,
				error: "Invalid credentials. Please try again" 
			});
		}

		console.log(user);

		const resolvedUserId = user.user_id || user.id;

		return handleAuthSuccess(
			res,
			200,
			"Login Successful",
			resolvedUserId,
			user.encrypted_email, {
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
			}
		);
	} catch (error) {
		return handleError(res, error, "authenticate user");
	}
});

// Post call to verify user existence via blind index and dispatch OTP email
router.post(
	"/forgot-password",
	validateBody(REQUIRED_FORGOT_PASSWORD_FIELDS),
	async (req, res) => {
		const startedAt = Date.now();
		const responseMessage =
			"If an account exists, a verification code will be dispatched";

		try {
			const email =
				typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
			const emailBlindIndex = req.body.email_blind_index;

			if (email && emailBlindIndex) {
				const user = await findUserByEmailBlindIndexInSupabase(emailBlindIndex);

				if (user) {
					// Fall back to user.id if user.user_id is undefined
					const resolvedUserId = user.user_id || user.id;
					// MUST await the email queue/dispatch
					await queueOtpEmail(email, resolvedUserId);
				}
			}
		} catch (error) {
			console.error("[Forgot Password] Exception caught during processing:", error);
		} finally {
			const remainingTime =
				PASSWORD_RESET_MIN_RESPONSE_MS - (Date.now() - startedAt);
			if (remainingTime > 0) {
				await new Promise((resolve) => setTimeout(resolve, remainingTime));
			}
		}

		return handleSuccess(res, 200, responseMessage);
	},
);

router.post(
	"/reset-password",
	validateBody(REQUIRED_RESET_PASSWORD_FIELDS),
	async (req, res) => {
		try {
			const { email_blind_index, password, reset_token } = req.body;

			console.log("[Reset Password] Incoming request with token:", reset_token);

			const user = await findUserByEmailBlindIndexInSupabase(email_blind_index);

			if (!user) {
				console.error("[Reset Password] Failed: User not found for blind index.");
				return handleError(
					res,
					new Error("User record not found"),
					"Find user. User record not found on the system",
				);
			}

			const resolvedUserId = user.user_id || user.id;

			console.log("[Reset Password] User found:", {
				resolvedUserId,
				hasPasswordHash: Boolean(user.password_hash)
			});

			const isTokenValid = isPasswordResetTokenValid(reset_token, resolvedUserId);
			console.log(`[Reset Password] Reset token validity check for user ${resolvedUserId}: ${isTokenValid}`);

			if (!isTokenValid) {
				return res.status(400).json({
					error: "Unable to reset password. Please restart the password reset process.",
				});
			}

			console.log(user.password_hash);

			if (!user.password_hash) {
				console.error(`[Reset Password] User ${resolvedUserId} missing password_hash in DB response!`);
				return res.status(500).json({
					error: "User record is missing password credentials. Please contact support.",
				});
			}

			const isSamePassword = await verifyPassword(user.password_hash, password);
			console.log(`[Reset Password] Is new password same as current password: ${isSamePassword}`);

			if (isSamePassword) {
				return res.status(400).json({
					error: "Cannot use the same password. Please choose a new password.",
				});
			}

			const tokenConsumed = consumePasswordResetToken(reset_token, resolvedUserId);
			console.log(`[Reset Password] Token consumed status: ${tokenConsumed}`);

			if (!tokenConsumed) {
				return res.status(400).json({
					error: "Unable to reset password. Please restart the password reset process.",
				});
			}

			const hashedPassword = await hashPassword(password);
			const updateResult = await updatePasswordInSupabase(
				resolvedUserId,
				hashedPassword,
			);

			console.log(`[Reset Password] Supabase password update result: ${Boolean(updateResult)}`);

			if (!updateResult) {
				return res.status(500).json({
					error: "Password could not be updated. Please try again.",
				});
			}

			console.log(`[Reset Password] Password reset completed successfully for user ${resolvedUserId}`);

			return handleAuthSuccess(
				res,
				200,
				"Password was successfully updated",
				resolvedUserId,
				user.encrypted_email,
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
				}
			);
		} catch (error) {
			console.error("[Reset Password] Fatal exception caught:", error);
			return handleError(res, error, "Reset Password Request");
		}
	},
);

module.exports = router;
