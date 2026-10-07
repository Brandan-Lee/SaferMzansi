const express = require("express");
const router = express.Router();

const contactController = require("#controllers/contactController.js");
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

router.post(
	"/add",
	validateBody(REQUIRED_CONTACT_FIELDS),
	contactController.addContact,
);

router.post(
	"/get-contacts",
	validateBody(REQUIRED_GET_CONTACT_FIELDS),
	contactController.getContacts,
);

router.post(
	"/update",
	validateBody(REQUIRED_CONTACT_FIELDS),
	contactController.updateContact,
);

module.exports = router;
