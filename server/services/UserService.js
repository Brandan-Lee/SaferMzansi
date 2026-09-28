const { supabase } = require("../database/supabase_init");
const { hashPassword, verifyPassword } = require("../utils/SecurityUtil");

//Method to create a user in supabase during registration
const createUserInSupabase = async (userData) => {
	//Retrieve the plain password and other user data
	const { password, ...otherUserData } = userData;
	const password_hash = await hashPassword(password);

	const payload = {
		...otherUserData,
		password_hash,
	};

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
	return data[0];
};

// Method to verify a user's credentials in Supabase during login process
const verifyUserInSupabase = async ({ encrypted_email, password }) => {
	const { data: user, error } = await supabase
		.from("Users")
		.select("*")
		.eq("encrypted_email", encrypted_email)
		.maybeSingle();

	// There was an error verifying the user's credentials on Supabase
	if (error || !user) {
		return null;
	}

	if (!user.password_hash) {
		return null;
	}

	//Verify the plain password against the stored password hash
	const isPasswordValid = await verifyPassword(user.password_hash, password);

	if (!isPasswordValid) {
		return null;
	}

	// Return that the users login credentials have been verified
	const { password_hash, ...safeUser } = user;
	return safeUser;
};

// Method that helps to mark the user as verified within Supabase
const updateUserVerificationInSupabase = async (userId) => {
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
