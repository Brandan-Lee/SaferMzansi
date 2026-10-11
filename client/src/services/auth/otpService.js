import {
	findLocalUserEmails,
	getLocalUserIdByEmail,
	markUserAsSynched,
	markUserAsVerifiedLocally,
} from "@database/repositories/userRepository";
import { postApi, safeApiCall } from "@services/ApiClient";

const normalizedEmail = (email) =>
	String(email ?? "")
		.trim()
		.toLowerCase();

//Method that uses the api client to send an OTP to the users email
export const sendOtpEmail = async (email) => {
	return safeApiCall(
		() => postApi("/otp/send-otp-email", { email: normalizedEmail(email) }),
		"[OTP Service] Failed to send OTP to the users email. Please try again",
	);
};

//Method to verify the otp code
export const verifyOtpCode = async (
	db,
	email,
	otp,
	purpose = "verification",
) => {
	const sanitizedEmail = normalizedEmail(email);
	const matchedUserId = await getLocalUserIdByEmail(db, sanitizedEmail);

	//Send the POST api call to verify the otp entered by the user
	const result = await safeApiCall(
		() =>
			postApi("/otp/verify-otp", {
				email: sanitizedEmail,
				otp,
				purpose,
			}),
		"Server verification failed",
	);

	//Result wasn't successfull
	if (!result.success) {
		return result;
	}

	//Once the result is returned, update local SQLite data
	if (db && matchedUserId) {
		try {
			await markUserAsVerifiedLocally(db, matchedUserId);
			await markUserAsSynched(db, matchedUserId);
		} catch (error) {
			console.warn(
				"[OTP Service] Failed to update local user data:",
				error.message,
			);
		}
	}

	return result;
};
