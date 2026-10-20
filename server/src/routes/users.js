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

const REQUIRED_DELETE_FIELDS = ["user_id"];

router.post(
	"/update",
	validateBody(REQUIRED_USER_FIELDS),
	userController.updateUser,
);

router.post(
	"/soft-delete",
	validateBody(REQUIRED_DELETE_FIELDS),
	userController.softDeleteUser,
);

router.post(
	"/hard-delete",
	validateBody(REQUIRED_DELETE_FIELDS),
	userController.hardDeleteUser,
);

module.exports = router;
