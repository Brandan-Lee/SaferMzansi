const contactModel = require("#models/contactModel.js");

const addEmergencyContact = async (contactData) => {
	const { contact_email_blind_index } = contactData;

	// Check if contact ID already exists
	const existingContact = await contactModel.findContactByEmailBlindIndex(
		contact_email_blind_index,
	);

	if (existingContact) {
		const err = new Error("This contact already exists.");
		err.status = 400;
		throw err;
	}

	try {
		const newContact = await contactModel.createEmergencyContact(contactData);
		if (!newContact) {
			throw new Error("Failed to create emergency contact in database.");
		}
		return newContact;
	} catch (error) {
		if (error.code === "23505") {
			const duplicateErr = new Error(
				"A contact with this email has already been registered on the server.",
			);
			duplicateErr.status = 409; // Conflict
			throw duplicateErr;
		}
		throw error;
	}
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
	//const { contact_id } = payload;

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

	return updatedContact;
};

const deleteContact = async (contactId, userId) => {
	const existingContact = await contactModel.findContactById(contactId);
	console.log(existingContact, "This is giving me a hard time");

	if (!existingContact) {
		throw new Error("This contact does not exist");
	}

	const deletedContact = await contactModel.deleteContact(contactId, userId);

	if (!deletedContact) {
		throw new Error("Failed to delete emergency contact in database");
	}

	return deletedContact;
};

module.exports = {
	addEmergencyContact,
	getEmergencyContacts,
	updateContact,
	deleteContact,
};
