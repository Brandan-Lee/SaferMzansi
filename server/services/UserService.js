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

// Fallback hash for password verification in case the user does not have a password hash stored
//Avoids timing attacks by using a constant time comparison for password verification
const FALLBACK_HASH =
	"$argon2id$v=19$m=65536,t=3,p=1$c2FtcGxlc2FsdA$c2FtcGxlaGFzaA";

// Method to verify a user's credentials in Supabase during login process
const verifyUserInSupabase = async ({ email_blind_index, password }) => {
	const { data: user, error } = await supabase
		.from("Users")
		.select("*")
		.eq("email_blind_index", email_blind_index)
		.maybeSingle();

	const passwordHashToVerify = user?.password_hash || FALLBACK_HASH;
	//Verify the plain password against the stored password hash
	const isPasswordValid = await verifyPassword(passwordHashToVerify, password);

	if (error || !user || !isPasswordValid || !user.is_verified) {
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

const findUserInSupabase = async (userId) => {
	if (!userId) {
		throw new Error("findUserInSupabase requires a valid user_id");
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

const findPasswordResetUserInSupabase = async (userId) => {
	const { data: user, error } = await supabase
		.from("Users")
		.select("user_id, encrypted_email")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return user;
};

const updatePasswordInSupabase = async (userId, passwordHash) => {
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

	if (!data || data.length === 0) {
		console.warn(
			"The password hash could not be updated in Supabase for user_id: ",
			userId,
		);
		return null;
	}

	return data[0];
};

const findUserByEmailBlindIndexInSupabase = async (emailBlindIndex) => {
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

module.exports = {
	createUserInSupabase,
	verifyUserInSupabase,
	updateUserVerificationInSupabase,
	findUserInSupabase,
	findPasswordResetUserInSupabase,
	updatePasswordInSupabase,
	findUserByEmailBlindIndexInSupabase,
};
