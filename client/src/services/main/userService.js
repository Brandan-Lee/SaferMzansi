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
import {
	decryptData,
	encryptData,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";

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

	const safeDecrypt = (val, fieldName) => {
		if (!val) return "";
		try {
			const decrypted = decryptData(val);
			if (decrypted) return decrypted;
			return val;
		} catch (err) {
			console.error(
				`Could not decrypt user field ${fieldName}:`,
				err,
			);
			return val;
		}
	};

	const firstName =
		safeDecrypt(
			rawUser.encrypted_name || rawUser.encrypted_first_name,
			"firstName",
		) ||
		rawUser.firstName ||
		rawUser.name ||
		"";

	const surname =
		safeDecrypt(
			rawUser.encrypted_surname || rawUser.encrypted_last_name,
			"surname",
		) ||
		rawUser.surname ||
		rawUser.last_name ||
		"";

	const email =
		safeDecrypt(rawUser.encrypted_email, "email") || rawUser.email || "";

	const userNumber =
		safeDecrypt(
			rawUser.encrypted_phone_num || rawUser.encrypted_phone,
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

	const newFirstName = firstName ? firstName.trim() : "";
	const newSurname = surname ? surname.trim() : "";
	const newPhone = phone ? phone.replace(/[\s-]/g, "") : "";
	const newEmail = email ? email.trim().toLowerCase() : "";

	// Extract existing contact safely
	const existingFirstName = existingUser.firstName
		? existingUser.firstName.trim()
		: "";
	const existingSurname = existingUser.surname
		? existingUser.surname.trim()
		: "";
	const existingPhone = existingUser.phone
		? existingUser.phone.replace(/[\s-]/g, "")
		: "";
	const existingEmail = existingUser.email
		? existingUser.email.trim().toLowerCase() // Added ()
		: "";

	// Re-encrypt values that have changed, or encrypt fresh values
	const encryptedName =
		newFirstName !== existingFirstName || !existingUser.encrypted_contact_name
			? encryptData(newFirstName)
			: existingUser.encrypted_contact_name;

	const encryptedSurname =
		newSurname !== existingSurname || !existingUser.encrypted_contact_surname
			? encryptData(newSurname)
			: existingUser.encrypted_contact_surname;

	const encryptedPhone =
		newPhone !== existingPhone || !existingUser.encrypted_contact_phone_num
			? encryptData(newPhone)
			: existingUser.encrypted_contact_phone_num;

	let emailBlindIndex = existingUser.contact_email_blind_index || null;
	let encryptedEmail = existingUser.encrypted_contact_email || null;

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
		encryptedSurname: encryptedSurname,
		encryptedPhoneNum: encryptedPhone,
		encryptedEmail: encryptedEmail,
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

	await markUserAsSoftDeletedLocally(db, userId);

	const result = await safeApiCall(
		() => postApi(
			"/users/soft-delete",
			{ user_id: userId },
		),
		"Server failed to soft delete user. Please try again",
	);

	if (result?.success) {
		await markUserAsSynched(db, userId);
	} else {
		console.warn("[User Service] Account deactivation saved locally for later sync");
		await markUserAsUnSynched(db, userId);
	}

	return {
		success: true,
	};
};

export const hardDeleteAccount = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is required for hard delete operations");
	}

	const result = await safeApiCall(
		() => postApi("/users/hard-delete", { user_id: userId }),
		"Server failed to hard delete account. Please try again.",
	);

	if (result?.success) {
	} else {
		console.warn(
			"[User Service] Backend hard delete failed or offline, proceeding with local deletion:",
			result?.error
		);
	}

	try {
		await deleteUserLocally(db, userId);
	} catch (error) {
		console.error("[User Service] Failed to delete user locally during hard delete:", error);
		throw new Error("Failed to clear local user data");
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