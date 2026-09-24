import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { decryptData, encryptPayload, hashPassword } from "../utils/Encryption";
import { postApi } from "./ApiClient";
import {
	findLocalUserEmails,
	insertLocalUser,
	markUserAsSynched,
} from "../database/UserRepository";

const TOKEN_KEY = "user_jwt_token";

// Service to handle user registration
export const registerUser = async (db, userData) => {
	//Data that needs to retrieved from the userData object for registration
	const { name, surname, email, phoneNum, password } = userData;

	//Check to see if the user has already registered before
	const existingUsers = await findLocalUserEmails(db);
	const isDuplicate = existingUsers.some(
		(u) => decryptData(u.encrypted_email)?.toLowerCase() === email.toLowerCase(),
	);

	//Validate the entered user email against all users emails and compare to find if they have registered before
	if (isDuplicate) {
		throw new Error(
			"A user with this email has already been registered on this device",
		);
	}

	// Generate a unique user ID to help with syncing data between the local database and supabase by generating a random 16-byte string.
	const userId = Crypto.randomUUID();

	// Encrypt sensitive user PII data to comply with POPIA regulations and hash password
	const passwordHash = hashPassword(password);
	const {
		name: encryptedName,
		surname: encryptedSurname,
		email: encryptedEmail,
		phoneNum: encryptedPhoneNum,
	} = encryptPayload({ name, surname, email, phoneNum });

	// Insert the new user into the local database
	await insertLocalUser(db, {
		userId,
		encryptedName,
		encryptedSurname,
		encryptedEmail,
		encryptedPhoneNum,
		passwordHash,
	});

	// Call Node.js server to perform registration process before synching with Supabase.
	const { ok, status, data } = await postApi("/users/register", {
		user_id: userId,
		encrypted_name: encryptedName,
		encrypted_surname: encryptedSurname,
		encrypted_email: encryptedEmail,
		encrypted_phone_num: encryptedPhoneNum,
		password_hash: passwordHash,
	});

	//There was an error synching the local data to the supabase table
	if (!ok || !data?.token) {
		const message =
			data?.error || data?.message || `Server sync failed (HTTP ${status})`;
		console.warn("Backend sync error", message);
		throw new Error(`${message}. Account saved locally.`);
	}

	// Store session tokens and update the sync flag
	await SecureStore.setItemAsync(TOKEN_KEY, data.token);
	await markUserAsSynched(db, userId);

	return { userId, email, token: data.token };
};
