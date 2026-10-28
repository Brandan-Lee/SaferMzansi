import * as FileSystem from "expo-file-system/legacy";
import {
	deleteUserLocally,
	getUserDetails,
	markUserAsSoftDeletedLocally,
	markUserAsSynched,
	markUserAsUnSynched,
	saveOrUpdateLocalUser,
	restoreUserLocally,
} from "@database/repositories/userRepository";
import { postApi, safeApiCall } from "@services/ApiClient";
import { decryptOrKeepValue } from "@utils/securityAndValidation/decryptionUtil";
import {
	encryptData,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";
import {
	normalizeEmail,
	normalizeName,
	normalizePhone,
} from "@utils/normalizationUtil";

export const getLocalUserDetails = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is needed to get local user details");
	}

	let rawUser;
	try {
		rawUser = await getUserDetails(db, userId);
	} catch (error) {
		throw new Error(
			"There was a problem retrieving the users details: " + error.message,
		);
	}

	if (!rawUser) {
		return null;
	}

	const firstName =
		decryptOrKeepValue(
			rawUser.encrypted_name || rawUser.encrypted_first_name,
			"user",
			"firstName",
		) ||
		rawUser.firstName ||
		rawUser.name ||
		"";

	const surname =
		decryptOrKeepValue(
			rawUser.encrypted_surname || rawUser.encrypted_last_name,
			"user",
			"surname",
		) ||
		rawUser.surname ||
		rawUser.last_name ||
		"";

	const email =
		decryptOrKeepValue(rawUser.encrypted_email, "user", "email") ||
		rawUser.email ||
		"";

	const userNumber =
		decryptOrKeepValue(
			rawUser.encrypted_phone_num || rawUser.encrypted_phone,
			"user",
			"userNumber",
		) ||
		rawUser.userNumber ||
		rawUser.phone ||
		rawUser.phone_number ||
		"";

	const fullName =
		`${firstName} ${surname}`.trim() || rawUser.userName || "User Profile";

	return {
		...rawUser,
		firstName,
		surname,
		fullName,
		email,
		userNumber,
	};
};

export const updateUser = async (
	db,
	userId,
	userPayload,
	existingUser = {},
) => {
	if (!userId) {
		throw new Error("User ID is required for update operations");
	}

	if (!userPayload) {
		throw new Error("User Payload is required for update operations");
	}

	const { firstName, surname, phone, email } = userPayload;

	const newFirstName = normalizeName(firstName);
	const newSurname = normalizeName(surname);
	const newPhone = normalizePhone(phone);
	const newEmail = normalizeEmail(email);

	const existingFirstName = normalizeName(existingUser.firstName);
	const existingSurname = normalizeName(existingUser.surname);
	const existingPhone = normalizePhone(existingUser.userNumber || existingUser.phone);
	const existingEmail = normalizeEmail(existingUser.email);

	// Only encrypt fields that changed so unrelated updates keep their ciphertext.
	const encryptedName =
		newFirstName !== existingFirstName || !existingUser.encrypted_name
			? encryptData(newFirstName)
			: existingUser.encrypted_name;

	const encryptedSurname =
		newSurname !== existingSurname || !existingUser.encrypted_surname
			? encryptData(newSurname)
			: existingUser.encrypted_surname;

	const encryptedPhone =
		newPhone !== existingPhone || !existingUser.encrypted_phone_num
			? encryptData(newPhone)
			: existingUser.encrypted_phone_num;

	let emailBlindIndex = existingUser.email_blind_index || null;
	let encryptedEmail = existingUser.encrypted_email || null;

	if (newEmail !== existingEmail || !encryptedEmail) {
		if (newEmail) {
			emailBlindIndex = generateBlindIndex(newEmail);
			encryptedEmail = encryptData(newEmail);
		}
	}

	const apiPayload = {
		user_id: userId,
		email_blind_index: emailBlindIndex,
		encrypted_name: encryptedName,
		encrypted_surname: encryptedSurname,
		encrypted_phone_num: encryptedPhone,
		encrypted_email: encryptedEmail,
	};

	const localUserPayload = {
		userId,
		emailBlindIndex,
		encryptedName,
		encryptedSurname,
		encryptedPhoneNum: encryptedPhone,
		encryptedEmail,
		passwordHash: existingUser.password_hash,
		isVerified: existingUser.is_verified || 0,
		isSynched: 0,
	};

	try {
		await saveOrUpdateLocalUser(db, localUserPayload);
	} catch (error) {
		console.error("User service failed to update local sqlite db:", error);
		throw new Error("Failed to update User profile locally");
	}

	const result = await safeApiCall(
		() => postApi("/users/update", apiPayload),
		"Server failed to update user profile. Saving changes locally for offline sync",
	);

	if (result?.success) {
		await markUserAsSynched(db, userId);
	} else {
		console.warn(
			"[User Service] Profile update saved locally for later sync:",
			result?.error,
		);
		await markUserAsUnSynched(db, userId);
	}

	return {
		success: true,
		userId,
		syncedWithServer: result?.success === true,
		message: "User Updated Successfully",
	};
};

export const softDeleteUser = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is needed for soft delete operations");
	}

	const result = await safeApiCall(
		() => postApi(
			"/users/soft-delete",
			{ user_id: userId },
		),
		"Server failed to soft delete user. Please try again",
	);

	if (!result?.success || result.data?.success !== true) {
		throw new Error(
			result?.error || "Server failed to soft delete user. Please try again",
		);
	}

	try {
		await markUserAsSoftDeletedLocally(db, userId);
		await markUserAsSynched(db, userId);
	} catch (error) {
		console.error(
			"[User Service] Account was disabled on the server, but local state could not be updated:",
			error,
		);
		throw new Error(
			"Your account was disabled on the server, but this device could not update its local profile. Please log in online to synchronize it.",
		);
	}

	return {
		success: true,
		syncedWithServer: true,
	};
};

export const hardDeleteAccount = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is required for hard delete operations");
	}

	const localEvidence = await db.getAllAsync(
		"SELECT local_file_url FROM Local_Evidence_Vault WHERE user_id = ?",
		[userId],
	);
	const result = await safeApiCall(
		() => postApi("/users/hard-delete", { user_id: userId }),
		"Server failed to hard delete account. Please try again.",
	);

	if (!result?.success) {
		throw new Error(
			result?.error || "Server failed to permanently delete the account.",
		);
	}

	try {
		await deleteUserLocally(db, userId);
	} catch (error) {
		console.error("[User Service] Failed to delete user locally during hard delete:", error);
		throw new Error("Failed to clear local user data");
	}

	for (const evidence of localEvidence) {
		const localFileUrl = evidence.local_file_url;
		if (
			localFileUrl?.startsWith("file://") ||
			localFileUrl?.startsWith("content://")
		) {
			try {
				await FileSystem.deleteAsync(localFileUrl, { idempotent: true });
			} catch (error) {
				console.warn(
					"[User Service] Could not remove a local evidence file:",
					error,
				);
			}
		}
	}

	return {
		success: true,
		message: "Account permanently deleted",
	};
};

export const restoreLocalAccountAfterLogin = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is required for local account restoration");
	}

	try {
		await restoreUserLocally(db, userId);
	} catch (error) {
		console.error("[User Service] Failed to restore user locally:", error);
		throw new Error("Failed to restore user profile locally");
	}

	return {
		success: true,
		userId,
		message: "Account locally restored",
	};
};