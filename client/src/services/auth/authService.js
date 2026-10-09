import * as Crypto from "expo-crypto";
import {
	encryptPayload,
	generateBlindIndex,
	decryptData,
} from "@utils/securityAndValidation/securityUtil";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	findUserByEmail,
	insertLocalUser,
	markUserAsSynched,
	markUserAsVerifiedLocally,
	saveOrUpdateLocalUser,
} from "@database/repositories/userRepository";
import {
	saveOrUpdateLocalEmergencyContact,
	markContactAsSynched,
} from "@database/repositories/contactRepository";
import { getAuthToken, saveToken } from "@utils/auth/authTokenUtil";

const normalizeEmail = (email) =>
	String(email ?? "")
		.trim()
		.toLowerCase();

const safeDecrypt = (val) => {
	if (!val) return "";
	try {
		return decryptData(val) || val;
	} catch (err) {
		return val;
	}
};

// Service to handle user registration
export const registerUser = async (db, userData) => {
	const { name, surname, email, phoneNum, password } = userData;

	// 1. Safely check if user exists locally
	let existingUser = null;
	try {
		existingUser = await findUserByEmail(db, email);
	} catch (dbErr) {
		console.warn("[User Service] Local DB check error:", dbErr);
	}

	if (existingUser) {
		throw new Error(
			"A user with this email has already been registered on this device",
		);
	}

	// 2. Generate unique user ID & encrypt PII
	const userId = Crypto.randomUUID();
	const emailBlindIndex = generateBlindIndex(email);
	const encryptedData = encryptPayload({ name, surname, email, phoneNum });

	// 3. Post to Node.js backend
	const apiPayload = {
		user_id: userId,
		email_blind_index: emailBlindIndex,
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

	if (!result?.success || !result?.data?.token) {
		console.warn("[User Service] Backend register error:", result?.error);
		throw new Error(result?.error || "Server registration failed.");
	}

	// 4. Save to local database with try/catch to avoid locking issues
	const localPayload = {
		userId,
		emailBlindIndex,
		encryptedName: encryptedData.name,
		encryptedSurname: encryptedData.surname,
		encryptedEmail: encryptedData.email,
		encryptedPhoneNum: encryptedData.phoneNum,
	};

	try {
		await insertLocalUser(db, localPayload);
		await markUserAsVerifiedLocally(db, userId);
		await markUserAsSynched(db, userId);
	} catch (localDbErr) {
		console.error("[User Service] Failed to sync local SQLite DB:", localDbErr);
		// Proceeding since backend registration succeeded and token was issued
	}

	// 5. Save the JWT token to SecureStore
	try {
		await saveToken(result.data.token);
	} catch (tokenErr) {
		console.error("[User Service] Failed to save token:", tokenErr);
	}

	return {
		userId,
		email: normalizeEmail(email),
		token: result.data.token,
		success: true,
	};
};

export const loginUser = async (db, email, password) => {
	if (!email || !password) {
		throw new Error("Email and password are required for login");
	}

	const emailBlindIndex = generateBlindIndex(email);
	let localUser = await findUserByEmail(db, email);
	let token = await getAuthToken();
	let isOffline = false;

	const response = await safeApiCall(
		() =>
			postApi("/users/login", {
				email_blind_index: emailBlindIndex,
				password,
			}),
		"Server login failed. Please try again",
	);

	if (response.success && response.data?.token) {
		token = response.data.token;
		await saveToken(token);

		const serverUser = response.data.user;
		const serverContacts = response.data.contacts || [];

		// 1. Sync User Record to local SQLite
		if (serverUser) {
			await saveOrUpdateLocalUser(db, {
				userId: serverUser.user_id,
				emailBlindIndex: serverUser.email_blind_index,
				encryptedName: serverUser.encrypted_name,
				encryptedSurname: serverUser.encrypted_surname,
				encryptedEmail: serverUser.encrypted_email,
				encryptedPhoneNum: serverUser.encrypted_phone_num,
				createdAt: serverUser.created_at,
				updatedAt: serverUser.updated_at,
				deletedAt: serverUser.deleted_at,
				isDeleted: serverUser.is_deleted ? 1 : 0,
				isVerified: serverUser.is_verified ? 1 : 0,
			});

			await markUserAsSynched(db, serverUser.user_id);
		}

		// 2. Sync all retrieved Supabase Emergency Contacts to local SQLite
		if (Array.isArray(serverContacts) && serverContacts.length > 0) {
			for (const contact of serverContacts) {
				const contactId = contact.contact_id || contact.id;

				const emailBlindIndex =
					contact.contact_email_blind_index ||
					contact.email_blind_index ||
					contact.emailBlindIndex;

				const localContactPayload = {
					contactId,
					userId: serverUser.user_id,
					emailBlindIndex,
					encryptedName:
						contact.encrypted_contact_name || contact.encryptedName,
					encryptedSurname:
						contact.encrypted_contact_surname || contact.encryptedSurname,
					encryptedPhoneNum:
						contact.encrypted_contact_phone_num ||
						contact.encryptedPhoneNum ||
						contact.encryptedPhone,
					encryptedEmail:
						contact.encrypted_contact_email || contact.encryptedEmail,
					createdAt: contact.created_at || new Date().toISOString(),
					updatedAt: contact.updated_at || new Date().toISOString(),
					isSynched: 1,
					isDeleted: contact.is_deleted ? 1 : 0,
				};

				try {
					await saveOrUpdateLocalEmergencyContact(
						db,
						serverUser.user_id,
						localContactPayload,
					);
					await markContactAsSynched(db, contactId);
				} catch (contactErr) {
					console.error(
						`[Auth Service] Failed to sync contact ${contactId} to SQLite:`,
						contactErr,
					);
				}
			}
		}
	} else if (response.status === 0) {
		isOffline = true;

		if (!localUser) {
			throw new Error(
				"No local user found for offline login. Please connect to the internet and try again.",
			);
		}

		if (!token) {
			token = `offline_token_${localUser.user_id}`;
			await saveToken(token);
		}
	} else {
		throw new Error(response.error || "Server login failed. Please try again");
	}

	return {
		userId: localUser?.user_id || response.data?.user?.user_id,
		userName: localUser?.encrypted_name || response.data?.user?.encrypted_name,
		email: normalizeEmail(email),
		user: localUser,
		token,
		isOffline,
	};
};

//Service to handle Forgot password request of the user
export const forgotPasswordUser = async (email) => {
	if (!email) {
		throw new Error("Email is required for password reset");
	}

	const normalEmail = normalizeEmail(email);
	const emailBlindIndex = generateBlindIndex(normalEmail);

	return safeApiCall(
		() =>
			postApi("/users/forgot-password", {
				email_blind_index: emailBlindIndex,
				email: normalEmail,
			}),
		"We'll send an OTP to this email if the user exists.",
	);
};

//Service to handle user reset password operations
export const resetPasswordUser = async (db, password, email, resetToken) => {
	if (!password || !email || !resetToken) {
		throw new Error(
			"Password, email, and reset token are required for password reset",
		);
	}

	const normalEmail = normalizeEmail(email);
	const emailBlindIndex = generateBlindIndex(normalEmail);

	const result = await safeApiCall(
		() =>
			postApi("/users/reset-password", {
				email_blind_index: emailBlindIndex,
				password,
				reset_token: resetToken,
			}),
		"There was an error updating your password",
	);

	if (!result.success) {
		throw new Error(result.error);
	}

	const serverUser = result.data?.user;

	if (serverUser) {
		await saveOrUpdateLocalUser(db, {
			userId: serverUser.user_id,
			emailBlindIndex: serverUser.email_blind_index,
			encryptedName: serverUser.encrypted_name,
			encryptedSurname: serverUser.encrypted_surname,
			encryptedEmail: serverUser.encrypted_email,
			encryptedPhoneNum: serverUser.encrypted_phone_num,
			createdAt: serverUser.created_at,
			updatedAt: serverUser.updated_at,
			deletedAt: serverUser.deleted_at,
			isDeleted: serverUser.is_deleted ? 1 : 0,
			isVerified: serverUser.is_verified ? 1 : 0,
		});

		await markUserAsSynched(db, serverUser.user_id);
	}

	return {
		success: true,
		message: result.data?.message || "Password updated successfully",
	};
};
