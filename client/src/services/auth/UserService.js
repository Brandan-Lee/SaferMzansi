import * as Crypto from "expo-crypto";
import { encryptPayload } from "../../utils/SecurityUtil";
import { postApi, safeApiCall } from "../ApiClient";
import {
	findUserByEmail,
	insertLocalUser,
	markUserAsSynched,
	markUserAsUnSynched,
	markUserAsVerifiedLocally,
} from "../../database/UserRepository";
import { getAuthToken, saveToken } from "../../utils/auth/AuthTokenUtil";

const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

//Method that ensures that users exist locally before authorization services can be performed
const requireLocalUser = async (db, email) => {
	const normalEmail = normalizeEmail(email);
	const user = await findUserByEmail(db, normalEmail);

	//User was not found
	if (!user) {
		throw new Error("User record not found on the device");
	}

	return { normalEmail, user };
};

// Service to handle user registration
export const registerUser = async (db, userData) => {
	//Data that needs to retrieved from the userData object for registration
	const { name, surname, email, phoneNum, password } = userData;

	//Check to see if the user has already registered before
	const existingUser = await findUserByEmail(db, email);

	if (existingUser) {
		throw new Error(
			"A user with this email has already been registered on this device",
		);
	}

	// Generate a unique user ID to help with syncing data between the local database and supabase by generating a random 16-byte string.
	const userId = Crypto.randomUUID();
	// Encrypt sensitive user PII data to comply with POPIA regulations and hash password
	const encryptedData = encryptPayload({ name, surname, email, phoneNum });

	// Call Node.js server to perform registration process before synching with Supabase.
	const apiPayload = {
		user_id: userId,
		encrypted_name: encryptedData.name,
		encrypted_surname: encryptedData.surname,
		encrypted_email: encryptedData.email,
		encrypted_phone_num: encryptedData.phoneNum,
		password,
	};

	const result = await safeApiCall(
		() => postApi("/users/register", apiPayload),
		"Server registration failed. Please try again",
	);

	if (!result.success || !result?.data?.token) {
		console.warn("[User Service] Backend register error:", result.error);
		throw new Error(result.error);
	}

	//Payload of data that has to be saved to the SQLite database
	const localPayload = {
		userId,
		encryptedName: encryptedData.name,
		encryptedSurname: encryptedData.surname,
		encryptedEmail: encryptedData.email,
		encryptedPhoneNum: encryptedData.phoneNum,
	};

	// Insert the new user into the local database
	await insertLocalUser(db, localPayload);

	//Perform SQLite operations and save the JWT token
	await markUserAsVerifiedLocally(db, userId);
	await markUserAsSynched(db, userId);
	await saveToken(result.data.token);

	//Data that has to be returned to the registration screen
	return { userId, email: normalizeEmail(email), token: result.data.token };
};

export const loginUser = async (db, email, password) => {
	const { normalEmail, user } = await requireLocalUser(db, email);
	let token = await getAuthToken();
	let isOffline = false;

	const response = await safeApiCall(
		() =>
			postApi("/users/login", {
				encrypted_email: user.encrypted_email,
				password,
			}),
		"Server login failed. Please try again",
	);

	if (response.success && response.data?.token) {
		token = response.data.token;
		await saveToken(token);

		if (user?.user_id) {
			await markUserAsSynched(db, user.user_id);
		}
	} else if (response.status === 0) {
		isOffline = true;
		if (!token) {
			token = `offline_token_${user.user_id}`;
			await saveToken(token);
		}
	} else {
		throw new Error(response.error || "Server login failed. Please try again");
	}

	return {
		userId: user.user_id,
		email: normalEmail,
		user: user,
		token,
		isOffline,
	};
};

//Service to handle Forgot password request of the user
export const forgotPasswordUser = async (db, email) => {
	const normalEmail = normalizeEmail(email);
	const matchedUser = await findUserByEmail(db, normalEmail);

	return safeApiCall(
		() =>
			postApi("/users/forgot-password", {
				email: normalEmail,
				user_id: matchedUser?.user_id,
				encrypted_email: matchedUser?.encrypted_email,
			}),
		"We'll send an OTP to this email if the user exists.",
	);
};

//Service to handle user reset password operations
export const resetPasswordUser = async (db, password, email, resetToken) => {
	const { user } = await requireLocalUser(db, email);

	const result = await safeApiCall(
		() =>
			postApi("/users/reset-password", {
				user_id: user.user_id,
				password,
				reset_token: resetToken,
			}),
		"There was an error updating your password",
	);

	if (!result.success) {
		throw new Error(result.error);
	}

	await markUserAsUnSynched(db, user.user_id);
	await markUserAsSynched(db, user.user_id);

	return {
		success: true,
		message: result.data?.message || "Password updated successfully",
	};
};
