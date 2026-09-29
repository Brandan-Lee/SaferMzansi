import {
	findLocalUserEmails,
	markUserAsSynched,
	markUserAsVerifiedLocally,
} from "../database/UserRepository";
import { decryptData } from "../utils/SecurityUtil";
import { postApi } from "./ApiClient";

const normalizedEmail = (email) => email?.trim().toLowerCase() || "";

//Method that uses the api client to send an OTP to the users email
export const sendOtpEmail = async (email) => {
	try {
		const response = await postApi("/otp/send-otp-email", { email: normalizedEmail(email) });

		if (!response.ok) {
			return { error: response.error || "Failed to send OTP" };
		}

		return { response };
	} catch (err) {
		return { error: err.message || "Network error sending OTP" };
	}
};

export const verifyOtpCode = async (db, email, otp) => {
	const sanitizedEmail = normalizedEmail(email);
	let matchedUserId = null;

	// if (db) {
	// 	try {
	// 		// Fetch all local user records
	// 		const localUsers = await findLocalUserEmails(db);

	// 		//Decrypt the raw email
	// 		const matchedUser = localUsers.find((user) => normalizedEmail(decryptData(user.encrypted_email)) === sanitizedEmail);

	// 		//Mathced user has been found
	// 		matchedUserId = matchedUser?.user_id || null;
	// 	} catch (error) {
	// 		console.error("Error retrieving local user_id:", error);
	// 	}
	// }

	// Send raw email, otp and user id to server
	const serverResponse = await postApi("/otp/verify-otp", {
		email: sanitizedEmail,
		otp,
	});

	//Failed server response
	if (!serverResponse || serverResponse.error) {
		throw new Error(serverResponse?.error || "Server verification failed.");
	}

	//Update local SQLite using user_id AFTER server verification succeeds and mark the user data as synched with supabase
	if (db && matchedUserId) {
		await markUserAsVerifiedLocally(db, matchedUserId);
		await markUserAsSynched(db, matchedUserId);
	}

	return serverResponse;
};
