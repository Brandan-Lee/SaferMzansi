const express = require("express");
const router = express.Router();

const userController = require("#controllers/userController.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_USER_FIELDS = [
	"user_id",
	"email_blind_index",
	"encrypted_name",
	"encrypted_surname",
	"encrypted_phone_num",
	"encrypted_email",
];

router.post(
	"/update",
	validateBody(REQUIRED_USER_FIELDS),
	userController.updateUser,
);

module.exports = router;
