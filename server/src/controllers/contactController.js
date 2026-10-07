const contactService = require("#services/contactService.js");

const addContact = async (req, res, next) => {
	try {
		const contact = await contactService.addEmergencyContact(req.body);
		return res.status(201).json({
			success: true,
			message: "Emergency contact added successfully",
			data: contact,
		});
	} catch (error) {
		next(error);
	}
};

const getContacts = async (req, res, next) => {
	try {
		// Support both user_id and userId from body or query
		const userId = req.body?.user_id || req.body?.userId || req.query?.user_id;

		const contacts = await contactService.getEmergencyContacts(userId);

		return res.status(200).json({
			success: true,
			message: "All emergency contacts retrieved",
			data: {
				contacts,
			},
		});
	} catch (error) {
		next(error);
	}
};

const updateContact = async (req, res, next) => {
	try {
		// Ensure contact_id and user_id are normalized for service consumption
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
	} catch (error) {
		next(error);
	}
};

module.exports = {
	addContact,
	getContacts,
	updateContact,
};