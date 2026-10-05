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

module.exports = {
    addContact,
};