const { supabase } = require("../database/supabase_init");

//Method to create a user in supabase during registration
const createUserInSupabase = async (userData) => {
	const { data, error } = await supabase
		.from("Users")
		.insert([userData])
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
    //Find the

	const { data, error } = await supabase
		.from("Users")
		.update({
			is_verified: true,
			updated_at: new Date().toISOString(), // Fixed timestamp format
		})
		.eq("user_id", userId)
		.select();

	// Check for explicit Supabase errors (e.g., schema/permission issues)
	if (error) {
		console.error("Supabase update error:", error);
		throw error;
	}

	// Check if any row was actually updated
	if (!data || data.length === 0) {
		console.warn(
			"No matching user found or update blocked by RLS policies for email:",
			encrypted_email,
		);
		return null;
	}

	return data[0];
};

module.exports = {
	createUserInSupabase,
	verifyUserInSupabase,
	updateUserVerificationInSupabase,
};
