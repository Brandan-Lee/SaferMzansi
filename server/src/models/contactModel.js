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
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data;
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

const findContactByEmailBlindIndex = async (emailBlindIndex) => {
	if (!emailBlindIndex) {
		throw new Error(
			"findContactByEmailBlindIndex requires a valid email_blind_index",
		);
	}

	const { data: contact, error } = await supabase
		.from("Emergency_Contacts")
		.select("*")
		.eq("contact_email_blind_index", emailBlindIndex)
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
		.match({ user_id: userId, is_deleted: 0 });

	if (error) {
		throw error;
	}

	return contacts || [];
};

const updateContact = async (payload) => {
	// 1. Separate target IDs from the fields being updated
	const { contact_id, user_id, ...updateFields } = payload;

	if (!contact_id || !user_id) {
		throw new Error("updateContact requires both contact_id and user_id");
	}

	// 2. Clean only the fields that need updating
	const cleanFields = Object.fromEntries(
		Object.entries(updateFields).filter(
			([_, value]) => value !== null && value !== undefined,
		),
	);

	cleanFields.updated_at = new Date().toISOString();

	// 3. Update using clean fields and match using extracted IDs
	const { data: contact, error } = await supabase
		.from("Emergency_Contacts")
		.update(cleanFields)
		.match({ contact_id, user_id })
		.select()
		.maybeSingle();

	if (error) {
		throw error;
	}

	return contact;
};

const deleteContact = async (contactId, userId) => {
	if (!contactId || !userId) {
		throw new Error("Delete Contact requires both contact id and userId");
	}

	const now = new Date().toISOString();

	const { data: contact, error } = await supabase
		.from("Emergency_Contacts") // Fixed table name (plural)
		.update({
			is_deleted: 1, // Or true if boolean in Supabase
			updated_at: now,
			deleted_at: now,
		})
		.match({ contact_id: contactId, user_id: userId }) // Fixed column names
		.select()
		.maybeSingle();

	if (error) {
		throw error;
	}

	return contact;
};

module.exports = {
	createEmergencyContact,
	findContactById,
	findContactByEmailBlindIndex,
	getEmergencyContacts,
	updateContact,
	deleteContact,
};
