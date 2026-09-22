const express = require("express");
const router = express.Router();
const { validateBody } = require("../middleware/ValidateRequest");
const { generateToken } = require("../services/AuthService");
const { createUserInSupabase } = require("../services/UserService");

const REQUIRED_REGISTRATION_FIELDS = [
	"user_id",
	"encrypted_name",
	"encrypted_surname",
	"encrypted_email",
	"encrypted_phone_num",
	"password_hash",
];

router.post(
	"/register",
	validateBody(REQUIRED_REGISTRATION_FIELDS),
	async (req, res) => {
		try {
			const {
				user_id,
				encrypted_name,
				encrypted_surname,
				encrypted_email,
				encrypted_phone_num,
				password_hash,
			} = req.body;

			//Save the data to the Supabase User Table
			await createUserInSupabase({
				user_id,
				encrypted_name,
				encrypted_surname,
				encrypted_email,
				encrypted_phone_num,
				password_hash,
			});

			//Generate a token for offline login verification
			const token = generateToken({
				userId: user_id,
				email: encrypted_email,
			});

			//User successfully registered
			return res.status(201).json({
				message: "User successfully registered and synched with database",
				token,
				user: { user_id, email: encrypted_email },
			});
		} catch (error) {
			console.error("Error during registration:", error);

			//User already exists
			if (error.code === "23505") {
				return res.status(409).json({
					error: "User already exists in the database",
				});
			}

			return res.status(500).json({ error: "Failed to save user in database" });
		}
	},
);

module.exports = router;
