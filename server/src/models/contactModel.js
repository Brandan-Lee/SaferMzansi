const { supabase } = require("#config/supabase_db.js");

const createEmergencyContact = async (payload) => {
    const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(
            ([_, value]) => value !== null && value !== undefined,
        ),
    );

    const { data, error } = await supabase
        .from("Emergency_Contacts")
        .insert([cleanPayload])
        .select();

    if (error) {
        throw error;
    }

    return data?.[0] || null;
};

const findContactById = async (contactId) => {
    if (!contactId) {
        throw new Error("findContactById requires a valid contact_id");
    }

    const { data: contact, error } = await supabase
        .from("Emergency_Contacts")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return contact;
};

const getEmergencyContacts = async (userId) => {
    if (!userId) {
        throw new Error("getContacts requires a valid user_id");
    }

    const { data: contacts, error } = await supabase
        .from("Emergency_Contacts")
        .select("*")
        .match({ "user_id": userId, "is_deleted": 0 });

    if (error) {
        throw error;
    }

    return contacts || [];
};

module.exports = {
    createEmergencyContact,
    findContactById,
    getEmergencyContacts,
};