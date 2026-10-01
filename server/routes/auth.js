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
} = require("../services/UserService");
const { hashPassword, verifyPassword } = require("../utils/SecurityUtil");
const {
	queueOtpEmail,
	isPasswordResetTokenValid,
	consumePasswordResetToken,
} = require("../services/OtpService");

const REQUIRED_REGISTRATION_FIELDS = [
	"user_id",
	"encrypted_name",
	"encrypted_surname",
	"encrypted_email",
	"encrypted_phone_num",
	"password",
];

const REQUIRED_LOGIN_FIELDS = ["encrypted_email", "password"];
const REQUIRED_FORGOT_PASSWORD_FIELDS = ["email"];
const REQUIRED_RESET_PASSWORD_FIELDS = ["user_id", "password", "reset_token"];
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
) => {
	const token = generateToken({ userId, email: encryptedEmail });

	return res.status(statusCode).json({
		message,
		token,
		user: {
			user_id: userId,
			email: encryptedEmail,
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
		error: `Failed to ${actionMessage} on the server`,
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
			const { user_id, encrypted_email } = req.body;

			// //Look if the user already exists on the supabase
			const user = await findUserInSupabase(user_id);

			if (user) {
				return res.status(409).json({
					error: "User already exists in the database",
				});
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
					"User record not found or update returned no data.",
				);

				// return res.status(404).json({
				// 	error: "User record not found or update returned no data.",
				// });
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
		const { encrypted_email, password } = req.body;

		// Verify the user credentials against the data stored in supabase
		const user = await verifyUserInSupabase({ encrypted_email, password });

		// Users credentials are wrong or doesn't exist
		if (!user) {
			return res.status(401).json({ 
				ok: false,
				error: "Invalid credentials. Please try again" 
			});
		}

		const resolvedUserId = user.user_id || user.id;

		return handleAuthSuccess(
			res,
			200,
			"Login Successful",
			resolvedUserId,
			encrypted_email,
		);
	} catch (error) {
		return handleError(res, error, "authenticate user");
	}
});

//Post call to verify the users email matches the email stored in supabase
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
			const userId = req.body.user_id || PASSWORD_RESET_LOOKUP_FALLBACK_ID;
			const user = await findPasswordResetUserInSupabase(userId);

			if (
				user &&
				req.body.encrypted_email &&
				user.encrypted_email === req.body.encrypted_email &&
				email
			) {
				queueOtpEmail(email, user.user_id);
			}
		} catch (error) {
			console.error("Error during forgot password request", error);
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

//Post call to reset the users password and update the password in supabase
router.post(
	"/reset-password",
	validateBody(REQUIRED_RESET_PASSWORD_FIELDS),
	async (req, res) => {
		try {
			//Retrieve the user id and password from the request
			const { user_id, password, reset_token } = req.body;

			if (!isPasswordResetTokenValid(reset_token, user_id)) {
				return res.status(400).json({
					error: "Unable to reset password. Please restart the password reset process.",
				});
			}

			const user = await findUserInSupabase(user_id);

			if (!user) {
				return handleError(
					res,
					new Error("User record not found"),
					"Reset Password Request",
				);
			}

			if (!user.password_hash) {
				return res.status(500).json({
					error:
						"User record is missing password credentials. Please contact support.",
				});
			}

			//Checks if the new password is the same as the old password
			const isSamePassword = await verifyPassword(user.password_hash, password);

			if (isSamePassword) {
				return res.status(400).json({
					error: "Cannot use the same password. Please choose a new password.",
				});
			}

			if (!consumePasswordResetToken(reset_token, user_id)) {
				return res.status(400).json({
					error: "Unable to reset password. Please restart the password reset process.",
				});
			}

			// Proceed with hashing and updating password
			const hashedPassword = await hashPassword(password);
			const updateResult = await updatePasswordInSupabase(
				user_id,
				hashedPassword,
			);

			if (!updateResult) {
				return res.status(500).json({
					error: "Password could not be updated. Please try again.",
				});
			}

			// return res.status(200).json({
			// 	success: true,
			// 	message: "Password was successfully updated",
			// });

			return handleSuccess(res, 200, "Password was successfully updated");
		} catch (error) {
			return handleError(res, error, "Reset Password Request");
		}
	},
);

module.exports = router;
