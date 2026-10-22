const { supabase } = require("#config/supabase_db.js");
const { omitNullish } = require("#utils/databaseUtil.js");

const TABLE_NAME = "Emergency_Contacts";

const createEmergencyContact = async (payload) => {
	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert([omitNullish(payload)])
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
		.from(TABLE_NAME)
		.select("*")
		.eq("contact_id", contactId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return contact;
};

const findContactByEmailBlindIndex = async (emailBlindIndex, userId) => {
	if (!emailBlindIndex || !userId) {
		throw new Error(
			"findContactByEmailBlindIndex requires a valid email_blind_index and user_id",
		);
	}

	const { data: contact, error } = await supabase
		.from(TABLE_NAME)
		.select("*")
		.match({
			contact_email_blind_index: emailBlindIndex,
			user_id: userId,
		})
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
		.from(TABLE_NAME)
		.select("*")
		.match({ user_id: userId, is_deleted: 0 });

	if (error) {
		throw error;
	}

	return contacts || [];
};

const updateContact = async (payload) => {
	const { contact_id, user_id, ...updateFields } = payload;

	if (!contact_id || !user_id) {
		throw new Error("updateContact requires both contact_id and user_id");
	}

	const cleanFields = omitNullish(updateFields);

	cleanFields.updated_at = new Date().toISOString();
	if (Object.prototype.hasOwnProperty.call(updateFields, "deleted_at")) {
		cleanFields.deleted_at = updateFields.deleted_at;
	}

	const { data: contact, error } = await supabase
		.from(TABLE_NAME)
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
		.from(TABLE_NAME)
		.update({
			is_deleted: 1,
			updated_at: now,
			deleted_at: now,
		})
		.match({ contact_id: contactId, user_id: userId })
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
