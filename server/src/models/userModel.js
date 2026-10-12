const { supabase } = require("#config/supabase_db.js");
const { hardDeleteUser } = require("#controllers/userController.js");

//Method to create a user in supabase during registration
const createUser = async (payload) => {
	const cleanPayload = Object.fromEntries(
		Object.entries(payload).filter(
			([_, value]) => value !== null && value !== undefined,
		),
	);

	const { data, error } = await supabase
		.from("Users")
		.insert([cleanPayload])
		.select();

	//There was an error inserting the user into supabase
	if (error) {
		throw error;
	}

	//Return the user object
	return data?.[0] || null;
};

const findUserByEmailBlindIndex = async (emailBlindIndex) => {
	if (!emailBlindIndex) {
		throw new Error(
			"findUserByEmailBlindIndexInSupabase requires a valid email_blind_index",
		);
	}

	const { data: user, error } = await supabase
		.from("Users")
		.select("*")
		.eq("email_blind_index", emailBlindIndex)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return user;
};

const findUserById = async (userId) => {
	if (!userId) {
		throw new Error("findUserById requires a valid user_id");
	}

	const { data: user, error } = await supabase
		.from("Users")
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	if (error || !user) {
		return null;
	}

	return user;
};

// // Method that helps to mark the user as verified within Supabase
const updateUserVerification = async (userId) => {
	if (!userId) {
		throw new Error(
			"updateUserVerificationInSupabase requires a valid user_id",
		);
	}

	const { data, error } = await supabase
		.from("Users")
		.update({
			is_verified: true,
		})
		.eq("user_id", userId)
		.select();

	if (error) {
		throw error;
	}

	return data?.[0] || null;
};

const updateUserPassword = async (userId, passwordHash) => {
	if (!userId || !passwordHash) {
		throw new Error("updatePasswordInSupabase");
	}

	const { data, error } = await supabase
		.from("Users")
		.update({ password_hash: passwordHash })
		.eq("user_id", userId)
		.select();

	if (error) {
		throw error;
	}

	return data?.[0] || null;
};

const updateUser = async (payload) => {
	if (!payload) {
		throw new Error("Update user in supabase");
	}

	const { user_id, ...updateFields } = payload;

	const cleanFields = Object.fromEntries(
		Object.entries(updateFields).filter(
			([_, value]) => value !== null && value !== undefined,
		),
	);

	cleanFields.updated_at = new Date().toISOString();

	const { data: user, error } = await supabase
		.from("Users")
		.update(cleanFields)
		.eq("user_id", user_id)
		.select()
		.maybeSingle();

	if (error) {
		throw error;
	}

	return user;
};


const softDeleteUser = async (userId) => {
	if (!userId) {
		throw new Error("User ID is need for soft delete operations");
	}

	const now = new Date().toISOString();

	//Soft delete the user account
	const { data: userData, error: userError } = await supabase
		.from("Users")
		.update({
			is_deleted: true,
			deleted_at: now,
			updated_at: now,
		})
		.eq("user_id", userId)
		.select()
		.maybeSingle();

	if (userError) {
		throw userError;
	}

	//Soft delete users emergency contacts
	const { error: contactsError } = await supabase
		.from("Emergency_Contacts")
		.update({
			is_deleted: true,
			deleted_at: now,
			updated_at: now,
		})
		.eq("user_id", userId);

	if (contactsError) {
		throw contactsError;
	}

	return userData;
};

const handleDeleteUser = async (userId) => {
	if (!userId) {
		throw new Error("User ID is needed for hard delete operations");
	}

	//Delete other tables first to prevent foreign key constraints
	const { error: contactsError } = await supabase
		.from("Emergency_Contacts")
		.delete()
		.eq("user_id", userId);

	if (contactsError) {
		console.warn(
			"Warning: Failed to delete emergency contacts during hard delete:",
			contactsError,
		);
		throw contactsError;
	}

	//Lastly delete the user record
	const { data: userData, error: userError } = await supabase
		.from("Users")
		.delete()
		.eq("user_id", userId)
		.select()
		.maybeSingle();

	if (userError) {
		throw userError;
	}

	return userData;
};

module.exports = {
	createUser,
	findUserByEmailBlindIndex,
	findUserById,
	updateUserVerification,
	updateUserPassword,
	updateUser,
	softDeleteUser,
	handleDeleteUser,
};
