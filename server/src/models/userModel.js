const { supabase } = require("#config/supabase_db.js");

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

module.exports = {
	createUser,
	findUserByEmailBlindIndex,
	findUserById,
	updateUserVerification,
	updateUserPassword,
};
