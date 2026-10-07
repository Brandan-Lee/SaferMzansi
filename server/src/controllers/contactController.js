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

const getContacts = async (req, res) => {
    try {
        const contacts = await contactService.getEmergencyContacts(req.body);

        return res.status(200).json({
            success: true,
            message: "All emergency contacts retrieved",
            data: {
                contacts,
            },
        });
    } catch (error) {
        console.error("Error retrieving emergency contacts:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve contacts",
            error: error.message || "Internal server error",
        });
    }
};

module.exports = {
    addContact,
    getContacts,
};