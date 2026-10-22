import * as Crypto from "expo-crypto";
import {
	encryptPayload,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	findUserByEmail,
	insertLocalUser,
	markUserAsSynched,
	markUserAsVerifiedLocally,
	saveOrUpdateLocalUser,
	updateLocalPasswordVerifier,
} from "@database/repositories/userRepository";
import { OFFLINE_TOKEN_PREFIX } from "@utils/auth/authTokenUtil";
import {
	createOfflinePasswordVerifier,
	verifyOfflinePassword,
} from "@utils/securityAndValidation/offlinePasswordUtil";
import { normalizeEmail } from "@utils/normalizationUtil";
import { syncServerAccount, syncServerIncidentsAndLocations } from "./authDataSyncService";

// Service to handle user registration
export const registerUser = async (db, userData) => {
	const { name, surname, email, phoneNum, password } = userData;

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

	const userId = Crypto.randomUUID();
	const emailBlindIndex = generateBlindIndex(email);
	const encryptedData = encryptPayload({ name, surname, email, phoneNum });

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
		() => postApi("/auth/register", apiPayload),
		"Server registration failed. Please try again",
	);

	if (!result?.success || !result?.data?.token) {
		console.warn("[User Service] Backend register error:", result?.error);
		throw new Error(result?.error || "Server registration failed.");
	}
	const serverPasswordHash = result.data.user?.password_hash;
	if (!serverPasswordHash) {
		throw new Error("Registration response did not include the password hash.");
	}

	// Keep the server hash for sync; use a separate device-keyed verifier offline.
	const localPasswordVerifier = await createOfflinePasswordVerifier(password);

	const localPayload = {
		userId,
		emailBlindIndex,
		encryptedName: encryptedData.name,
		encryptedSurname: encryptedData.surname,
		encryptedEmail: encryptedData.email,
		encryptedPhoneNum: encryptedData.phoneNum,
		passwordHash: serverPasswordHash,
		offlinePasswordVerifier: localPasswordVerifier,
	};

	try {
		await insertLocalUser(db, localPayload);
		await markUserAsVerifiedLocally(db, userId);
		await markUserAsSynched(db, userId);
	} catch (localDbErr) {
		console.error("[User Service] Failed to sync local SQLite DB:", localDbErr);
		throw new Error(
			"Your account was registered online, but offline login could not be saved on this device.",
		);
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

	let token = null;
	const localUser = await findUserByEmail(db, email);
	let isOffline = false;

	const response = await safeApiCall(
		() =>
			postApi("/auth/login", {
				email_blind_index: emailBlindIndex,
				password,
			}),
		"Server login failed. Please try again",
	);

	if (response.success && response.data?.token) {
		token = response.data.token;

		const serverUser = response.data.user;
		await syncServerAccount(db, {
			user: serverUser,
			password,
			existingPasswordHash: localUser?.password_hash,
			contacts: response.data.contacts,
			evidence: response.data.evidence,
			incidents: response.data.incidents,
			locations:
				response.data.incident_locations || response.data.locations,
		});
	} else if (response.status === 0) {
		isOffline = true;

		if (!localUser) {
			throw new Error(
				"No local user found for offline login. Please connect to the internet and try again.",
			);
		}

		if (!localUser.password_hash) {
			throw new Error(
				"Offline authentication credentials are missing. Please connect online once to sync.",
			);
		}

		const passwordCheck = await verifyOfflinePassword(
			password,
			localUser.offline_password_verifier || localUser.password_hash,
		);
		if (!passwordCheck.valid) {
			throw new Error(
				"Invalid credentials. Please check your password and try again.",
			);
		}
		if (passwordCheck.upgradedVerifier) {
			await updateLocalPasswordVerifier(
				db,
				localUser.user_id,
				passwordCheck.upgradedVerifier,
			);
		}

		token = `${OFFLINE_TOKEN_PREFIX}${localUser.user_id}`;
	} else {
		throw new Error(response.error || "Server login failed. Please try again");
	}

	const authenticatedUser = response.success
		? response.data?.user
		: localUser;

	return {
		userId: authenticatedUser?.user_id,
		userName: authenticatedUser?.encrypted_name,
		email: normalizeEmail(email),
		user: authenticatedUser,
		token,
		isOffline,
	};
};

// Service to handle Forgot password request of the user
export const forgotPasswordUser = async (email) => {
	if (!email) {
		throw new Error("Email is required for password reset");
	}

	const normalEmail = normalizeEmail(email);
	const emailBlindIndex = generateBlindIndex(normalEmail);

	return safeApiCall(
		() =>
			postApi("/auth/forgot-password", {
				email_blind_index: emailBlindIndex,
				email: normalEmail,
			}),
		"We'll send an OTP to this email if the user exists.",
	);
};

// Service to handle user reset password operations
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
			postApi("/auth/reset-password", {
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
	const serverIncidents = result.data?.incidents || [];
	const serverLocations =
		result.data?.incident_locations || result.data?.locations || [];

	if (
		!serverUser ||
		typeof serverUser.password_hash !== "string" ||
		!serverUser.password_hash
	) {
		throw new Error(
			"Password reset response is missing the updated password hash.",
		);
	}

	const localPasswordVerifier =
		await createOfflinePasswordVerifier(password);

	await saveOrUpdateLocalUser(db, {
		userId: serverUser.user_id,
		emailBlindIndex: serverUser.email_blind_index,
		encryptedName: serverUser.encrypted_name,
		encryptedSurname: serverUser.encrypted_surname,
		encryptedEmail: serverUser.encrypted_email,
		encryptedPhoneNum: serverUser.encrypted_phone_num,
		passwordHash: serverUser.password_hash,
		offlinePasswordVerifier: localPasswordVerifier,
		createdAt: serverUser.created_at,
		updatedAt: serverUser.updated_at,
		deletedAt: serverUser.deleted_at,
		isDeleted: serverUser.is_deleted ? 1 : 0,
		isVerified: serverUser.is_verified ? 1 : 0,
	});

	await markUserAsSynched(db, serverUser.user_id);

	await syncServerIncidentsAndLocations(
		db,
		serverUser.user_id,
		serverIncidents,
		serverLocations,
	);

	return {
		success: true,
		message: result.data?.message || "Password updated successfully",
	};
};
