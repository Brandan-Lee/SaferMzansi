import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import {
	decryptData,
	encryptPayload,
	hashPassword,
} from "../utils/SecurityUtil";
import { postApi } from "./ApiClient";
import {
	findLocalUserEmails,
	insertLocalUser,
	markUserAsSynched,
} from "../database/UserRepository";

const TOKEN_KEY = "user_jwt_token";

//Helper method to save the JWT token
const saveToken = async (token) => {
	if (token) {
		await SecureStore.setItemAsync(TOKEN_KEY, token);
	}
};

//Helper method to find the user by their email
const findUserByEmail = async (db, targetEmail) => {
	const normalizedEmail = targetEmail.trim().toLowerCase();
	const localUsers = await findLocalUserEmails(db);

	return localUsers.find(
		(user) =>
			decryptData(user.encrypted_email)?.toLowerCase() === normalizedEmail,
	);
};

//Helper method to format the encrypted api payload
const formatApiPayload = (userId, encryptedData, passwordHash) => ({
	user_id: userId,
	encrypted_name: encryptedData.name,
	encrypted_surname: encryptedData.surname,
	encrypted_email: encryptedData.email,
	encrypted_phone_num: encryptedData.phoneNum,
	password_hash: passwordHash,
});

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
	const passwordHash = hashPassword(password);
	const encryptedData = encryptPayload({ name, surname, email, phoneNum });

	const localPayload = {
		userId,
		encryptedName: encryptedData.name,
		encryptedSurname: encryptedData.surname,
		encryptedEmail: encryptedData.email,
		encryptedPhoneNum: encryptedData.phoneNum,
		passwordHash,
	};

	// Insert the new user into the local database
	await insertLocalUser(db, localPayload);

	// Call Node.js server to perform registration process before synching with Supabase.
	const apiPayload = formatApiPayload(userId, encryptedData, passwordHash);
	const { ok, status, data } = await postApi("/users/register", apiPayload);

	//There was an error synching the local data to the supabase table
	if (!ok || !data?.token) {
		const message =
			data?.error || data?.message || `Server sync failed (HTTP ${status})`;
		console.warn("Backend sync error", message);
		throw new Error(`${message}. Account saved locally.`);
	}

	// Store session tokens and update the sync flag
	await saveToken(data.token);
	await markUserAsSynched(db, userId);

	//Data that has to be returned to the registration screen
	return { userId, email, token: data.token };
};

// Service to handle User Login
export const loginUser = async (db, email, password) => {
	const normalEmail = email.trim().toLowerCase();
	// Hash the incoming password
	const passwordHash = hashPassword(password);

	// Check to see if the User has already registered and exists in the local database
	const matchedUser = await findUserByEmail(db, normalEmail);

	// Check if user exists locally or if there passwords are correct or not
	if (!matchedUser || matchedUser.password_hash !== passwordHash) {
		throw new Error("Invalid email or password. Please try again");
	}

	// Retrieve the JWT token that is stored on the device
	let token = await SecureStore.getItemAsync(TOKEN_KEY);
	let isOffline = false;

	// Should the user be online, re-authenticate through the server to retrieve new JWT token
	const { ok, data } = await postApi("/users/login", {
		encrypted_email: matchedUser.encrypted_email,
		password_hash: passwordHash,
	});

	// API call was a success and new token was generated and retrieved
	if (ok && data?.token) {
		token = data.token;
		// Store the new JWT token on the hardware device
		await saveToken(token);

		// Update the synched status with the cloud database
		if (matchedUser.user_id) {
			await markUserAsSynched(db, matchedUser.user_id);
		}
	} else {
		isOffline = true;
		if (!token) {
			token = `offline_token_${matchedUser.user_id}`;
			await saveToken(token);
		}
	}

	// Data that has to be returned to the login screen
	return {
		userId: matchedUser.user_id,
		email: normalEmail,
		user: matchedUser,
		token,
		isOffline,
	};
};
