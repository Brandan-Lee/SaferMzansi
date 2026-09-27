const { supabase } = require("../database/supabase_init");

//Method to create a user in supabase during registration
const createUserInSupabase = async (userData) => {
	const cleanPayload = Object.fromEntries(
		Object.entries(userData).filter(([_, value]) => value !== null),
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
	return data[0];
};

// Method to verify a user's credentials in Supabase during login process
const verifyUserInSupabase = async ({ encrypted_email, password_hash }) => {
	const { data, error } = await supabase
		.from("Users")
		.select("*")
		.eq("encrypted_email", encrypted_email)
		.eq("password_hash", password_hash)
		.maybeSingle();

	// There was an error verifying the user's credentials on Supabase
	if (error) {
		throw error;
	}

	// Return that the users login credentials have been verified
	return data;
};

// Method that helps to mark the user as verified within Supabase
const updateUserVerificationInSupabase = async (userId) => {
	if (!userId) {
		throw new Error("updateUserVerificationInSupabase requires a valid user_id");
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


	if (!data || data.length === 0) {
		console.warn(`No row updated in Supabase for user_id: ${userId}`);
		return null;
	}

	return data[0];
};

module.exports = {
	createUserInSupabase,
	verifyUserInSupabase,
	updateUserVerificationInSupabase,
};
