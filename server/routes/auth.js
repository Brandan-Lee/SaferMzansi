const express = require("express");
const router = express.Router();
const { validateBody } = require("../middleware/ValidateRequest");
const { generateToken } = require("../services/AuthService");
const {
	createUserInSupabase,
	verifyUserInSupabase,
	findUserInSupabase,
	updateUserVerificationInSupabase,
} = require("../services/UserService");

const REQUIRED_REGISTRATION_FIELDS = [
	"user_id",
	"encrypted_name",
	"encrypted_surname",
	"encrypted_email",
	"encrypted_phone_num",
	"password",
];

const REQUIRED_LOGIN_FIELDS = ["encrypted_email", "password"];

const REQUIRED_FORGOT_PASSWORD_FIELDS = ["encrypted_email", "user_id"];

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

//Post call to register the user
router.post(
	"/register",
	validateBody(REQUIRED_REGISTRATION_FIELDS),
	async (req, res) => {
		try {
			//fields that is needed to update supabase table
			const { user_id, encrypted_email } = req.body;

			//Save the data to the Supabase User Table
			await createUserInSupabase(req.body);

			//OTP verification has passed
			const updatedUser = await updateUserVerificationInSupabase(user_id);

			if (!updatedUser) {
				if (!updatedUser) {
					handleError(res, error, "User record not found or update returned no data.")
				}
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

//Post call to login the user and verify their credentials
router.post("/login", validateBody(REQUIRED_LOGIN_FIELDS), async (req, res) => {
	try {
		const { encrypted_email, password } = req.body;

		//Verify the user credentials against the data stored in supabase
		const user = await verifyUserInSupabase({ encrypted_email, password });

		//Users credentials are wrong or doesn't exist
		if (!user) {
			return res
				.status(401)
				.json({ error: "Invalid credentials. Please try again" });
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

router.post(
	"/forgot-password",
	validateBody(REQUIRED_FORGOT_PASSWORD_FIELDS),
	async (req, res) => {
		try {
			const { encrypted_email, user_id } = req.body;
			const user = await findUserInSupabase(user_id);

			if (!user) {
				return res
					.status(401)
					.json({ error: "We'll send an email if this user does exist" });
			}

			return res.status(200).json({
				success: true,
				messagee: "Forgot Password email verification successfull",
				encrypted_email,
			});
		} catch (error) {
			return handleError(res, error, "authenticate user");
		}
	},
);

module.exports = router;
