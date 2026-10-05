const contactModel = require("#models/contactModel.js");

const addEmergencyContact = async (contactData) => {
    const { contact_id } = contactData;

    const existingContact = await contactModel.findContactById(contact_id);

    if (existingContact) {
        return existingContact; // Idempotent handling for offline sync retries
    }

    const newContact = await contactModel.createEmergencyContact(contactData);

    if (!newContact) {
        throw new Error("Failed to create emergency contact in database");
    }

    return newContact;
};

module.exports = {
    addEmergencyContact,
};