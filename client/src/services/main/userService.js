import { getUserDetails } from "@database/repositories/userRepository";
import { decryptData } from "@utils/securityAndValidation/securityUtil";

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
				`[DEBUG] Decryption failed for user field ${fieldName}:`,
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
