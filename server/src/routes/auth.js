const express = require("express");
const router = express.Router();

const authController = require("#controllers/authController.js");
const { validateBody } = require("#middleware/validateRequest.js");

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
const REQUIRED_RESET_PASSWORD_FIELDS = [
	"email_blind_index",
	"password",
	"reset_token",
];

router.post(
	"/register",
	validateBody(REQUIRED_REGISTRATION_FIELDS),
	authController.register,
);
router.post(
	"/login",
	validateBody(REQUIRED_LOGIN_FIELDS),
	authController.login,
);
router.post(
	"/forgot-password",
	validateBody(REQUIRED_FORGOT_PASSWORD_FIELDS),
	authController.forgotPassword,
);
router.post(
	"/reset-password",
	validateBody(REQUIRED_RESET_PASSWORD_FIELDS),
	authController.resetPassword,
);

module.exports = router;
