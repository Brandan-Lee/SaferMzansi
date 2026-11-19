const express = require("express");
const router = express.Router();

const contactController = require("#controllers/contactController.js");
const asyncHandler = require("#middleware/asyncHandler.js");
const authenticateUser = require("#middleware/authenticateUser.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_CONTACT_FIELDS = [
	"contact_id",
	"user_id",
	"contact_email_blind_index",
	"encrypted_contact_name",
	"encrypted_contact_surname",
	"encrypted_contact_phone_num",
	"encrypted_contact_email",
];

const REQUIRED_GET_CONTACT_FIELDS = ["user_id"];

const REQUIRED_DELETE_CONTACT_FIELDS = ["contact_id", "user_id"];

router.post(
	"/add",
	authenticateUser,
	validateBody(REQUIRED_CONTACT_FIELDS),
	asyncHandler(contactController.addContact),
);

router.post(
	"/get-contacts",
	authenticateUser,
	validateBody(REQUIRED_GET_CONTACT_FIELDS),
	asyncHandler(contactController.getContacts),
);

router.post(
	"/update",
	authenticateUser,
	validateBody(REQUIRED_CONTACT_FIELDS),
	asyncHandler(contactController.updateContact),
);

router.post(
	"/delete",
	authenticateUser,
	validateBody(REQUIRED_DELETE_CONTACT_FIELDS),
	asyncHandler(contactController.deleteContact),
);

module.exports = router;
