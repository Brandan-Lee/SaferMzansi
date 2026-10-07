const express = require("express");
const router = express.Router();

const contactController = require("#controllers/contactController.js");
const { validateBody } = require("#middleware/validateRequest.js");

const REQUIRED_CONTACT_FIELDS = [
    "contact_id",
    "user_id",
    "encrypted_contact_name",
    "encrypted_contact_surname",
    "encrypted_contact_phone_num",
];

const REQUIRED_GET_CONTACT_FIELDS = [
    "user_id",
];

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

module.exports = router;