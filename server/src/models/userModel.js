const { supabase } = require("#config/supabase_db.js");
const { omitNullish } = require("#utils/databaseUtil.js");

const USER_TABLE = "Users";

const createUser = async (payload) => {
	const { data, error } = await supabase
		.from(USER_TABLE)
		.insert([omitNullish(payload)])
		.select();

	if (error) {
		throw error;
	}

	return data?.[0] || null;
};

const findUserByEmailBlindIndex = async (emailBlindIndex) => {
	if (!emailBlindIndex) {
		throw new Error(
			"findUserByEmailBlindIndexInSupabase requires a valid email_blind_index",
		);
	}

	const { data: user, error } = await supabase
		.from(USER_TABLE)
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
		.from(USER_TABLE)
		.select("*")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!user) {
		return null;
	}

	return user;
};

const updateUserVerification = async (userId) => {
	if (!userId) {
		throw new Error(
			"updateUserVerificationInSupabase requires a valid user_id",
		);
	}

	const { data, error } = await supabase
		.from(USER_TABLE)
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
		throw new Error("A user ID and password hash are required.");
	}

	const { data, error } = await supabase
		.from(USER_TABLE)
		.update({ password_hash: passwordHash })
		.eq("user_id", userId)
		.select();

	if (error) {
		throw error;
	}

	return data?.[0] || null;
};

const restoreUserAccount = async (userId) => {
	if (!userId) {
		throw new Error("A user ID is required to restore an account.");
	}

	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from(USER_TABLE)
		.update({ is_deleted: false, deleted_at: null, updated_at: now })
		.eq("user_id", userId)
		.select()
		.maybeSingle();

	if (error) throw error;
	if (!data) throw new Error("The account could not be restored.");
	return data;
};

const updateUser = async (payload) => {
	if (!payload) {
		throw new Error("User details are required for an update.");
	}

	const { user_id, ...updateFields } = payload;

	const cleanFields = omitNullish(updateFields);

	cleanFields.updated_at = new Date().toISOString();

	const { data: user, error } = await supabase
		.from(USER_TABLE)
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
		throw new Error("A user ID is required to deactivate an account.");
	}

	const now = new Date().toISOString();

	const { data: userData, error: userError } = await supabase
		.from(USER_TABLE)
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
	return userData;
};

const handleDeleteUser = async (userId) => {
	if (!userId) {
		throw new Error("User ID is needed for hard delete operations");
	}

	const { data: userData, error: userError } = await supabase
		.from(USER_TABLE)
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
	restoreUserAccount,
	updateUser,
	softDeleteUser,
	handleDeleteUser,
};
