const contactModel = require("#models/contactModel.js");

const addEmergencyContact = async (contactData) => {
	const { contact_email_blind_index } = contactData;

	const existingContact = await contactModel.findContactByEmailBlindIndex(
		contact_email_blind_index,
		contactData.user_id,
	);

	if (existingContact) {
		if (existingContact.user_id === contactData.user_id) {
			const reconciledContact = await contactModel.updateContact({
				...contactData,
				contact_id: existingContact.contact_id,
				is_deleted: false,
				deleted_at: null,
			});
			if (!reconciledContact) {
				throw new Error("Failed to reconcile emergency contact in database.");
			}
			return reconciledContact;
		}

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
	const updatedContact = await contactModel.updateContact(payload);

	if (!updatedContact) {
		throw new Error("Failed to update emergency contact in database");
	}

	return updatedContact;
};

const deleteContact = async (contactId, userId) => {
	const existingContact = await contactModel.findContactById(contactId);

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
