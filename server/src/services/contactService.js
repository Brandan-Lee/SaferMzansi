const contactModel = require("#models/contactModel.js");

const addEmergencyContact = async (contactData) => {
	const { contact_id } = contactData;

	const existingContact = await contactModel.findContactById(contact_id);

	if (existingContact) {
		return existingContact;
	}

	const newContact = await contactModel.createEmergencyContact(contactData);

	if (!newContact) {
		throw new Error("Failed to create emergency contact in database");
	}

	return newContact;
};

const getEmergencyContacts = async (payload) => {
	const user_id = payload;
	console.log(payload);
	console.log("Fetching emergency contacts for user_id:", user_id);

	if (!user_id) {
		throw new Error("user_id is required to fetch contacts");
	}

	const contacts = await contactModel.getEmergencyContacts(user_id);

	if (!contacts) {
		throw new Error("Failed to retrieve emergency contacts from database");
	}

	return contacts;
};

const updateContact = async (payload) => {
	const { contact_id } = payload;

	// const existingContact = await contactModel.findContactById(contact_id);
	// console.log(existingContact, "This is giving me a hard time");

	// if (existingContact) {
	// 	return existingContact;
	// }

	const updatedContact = await contactModel.updateContact(payload);
	console.log("Updated contact or well it should:::::", updatedContact);

	if (!updatedContact) {
		throw new Error("Failed to update emergency contact in database");
	}
};

module.exports = {
	addEmergencyContact,
	getEmergencyContacts,
	updateContact,
};
