// const { supabase } = require("#config/supabase_db.js");
// const { hashPassword, verifyPassword } = require("#utils/securityUtil.js");

// // Method that helps to mark the user as verified within Supabase
// const updateUserVerificationInSupabase = async (userId) => {
// 	if (!userId) {
// 		throw new Error(
// 			"updateUserVerificationInSupabase requires a valid user_id",
// 		);
// 	}

// 	const { data, error } = await supabase
// 		.from("Users")
// 		.update({
// 			is_verified: true,
// 		})
// 		.eq("user_id", userId)
// 		.select();

// 	if (error) {
// 		throw error;
// 	}

// 	if (!data || data.length === 0) {
// 		console.warn(`No row updated in Supabase for user_id: ${userId}`);
// 		return null;
// 	}

// 	return data[0];
// };

// const findUserInSupabase = async (userId) => {
// 	if (!userId) {
// 		throw new Error("findUserInSupabase requires a valid user_id");
// 	}

// 	const { data: user, error } = await supabase
// 		.from("Users")
// 		.select("*")
// 		.eq("user_id", userId)
// 		.maybeSingle();

// 	if (error || !user) {
// 		return null;
// 	}

// 	return user;
// };

// const findPasswordResetUserInSupabase = async (userId) => {
// 	const { data: user, error } = await supabase
// 		.from("Users")
// 		.select("user_id, encrypted_email")
// 		.eq("user_id", userId)
// 		.maybeSingle();

// 	if (error) {
// 		throw error;
// 	}

// 	return user;
// };

// const updatePasswordInSupabase = async (userId, passwordHash) => {
// 	if (!userId || !passwordHash) {
// 		throw new Error("updatePasswordInSupabase");
// 	}

// 	const { data, error } = await supabase
// 		.from("Users")
// 		.update({ password_hash: passwordHash })
// 		.eq("user_id", userId)
// 		.select();

// 	if (error) {
// 		throw error;
// 	}

// 	if (!data || data.length === 0) {
// 		console.warn(
// 			"The password hash could not be updated in Supabase for user_id: ",
// 			userId,
// 		);
// 		return null;
// 	}

// 	return data[0];
// };

// const findUserByEmailBlindIndexInSupabase = async (emailBlindIndex) => {
// 	if (!emailBlindIndex) {
// 		throw new Error(
// 			"findUserByEmailBlindIndexInSupabase requires a valid email_blind_index",
// 		);
// 	}

// 	const { data: user, error } = await supabase
// 		.from("Users")
// 		.select("*")
// 		.eq("email_blind_index", emailBlindIndex)
// 		.maybeSingle();

// 	if (error) {
// 		throw error;
// 	}

// 	return user;
// };

// module.exports = {
// 	updateUserVerificationInSupabase,
// 	findUserInSupabase,
// 	findPasswordResetUserInSupabase,
// 	updatePasswordInSupabase,
// 	findUserByEmailBlindIndexInSupabase,
// };
