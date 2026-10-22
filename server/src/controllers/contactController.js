const contactService = require("#services/main/contactServiceServer.js");

const addContact = async (req, res) => {
	const contact = await contactService.addEmergencyContact(req.body);
	return res.status(201).json({
		success: true,
		message: "Emergency contact added successfully",
		data: contact,
	});
};

const getContacts = async (req, res) => {
	const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;

	const contacts = await contactService.getEmergencyContacts(userId);

	return res.status(200).json({
		success: true,
		message: "All emergency contacts retrieved",
		data: { contacts },
	});
};

const updateContact = async (req, res) => {
	const payload = {
		...req.body,
		contact_id: req.body.contact_id || req.body.contactId,
		user_id: req.body.user_id || req.body.userId,
	};

	const contact = await contactService.updateContact(payload);

	return res.status(200).json({
		success: true,
		message: "Emergency contact updated successfully",
		data: contact,
	});
};

const deleteContact = async (req, res) => {
	const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;
	const contactId =
		req.body?.contact_id || req.body?.contactId || req.query?.contact_id;

	const contact = await contactService.deleteContact(contactId, userId);

	return res.status(200).json({
		success: true,
		message: "Emergency contact deleted successfully",
		data: contact,
	});
};

module.exports = {
	addContact,
	getContacts,
	updateContact,
	deleteContact,
};
