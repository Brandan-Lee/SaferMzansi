import { findLocalUserEmails, markUserAsVerifiedLocally } from "../database/UserRepository";
import { decryptData } from "../utils/SecurityUtil";
import { postApi } from "./ApiClient";

//Method that uses the api client to send an OTP to the users email
export const sendOtpEmail = async (email) => {
    return await postApi("/otp/send-otp-email", {email});
}

export const verifyOtpCode = async (db, email, otp) => {
    const sanitizedEmail = email.trim().toLowerCase();
    let matchedUserId = null;

    if (db) {
            try {
                // Fetch all local user records
            const localUsers = await findLocalUserEmails(db);
            
            //Decrypt the raw email
            const matchedUser = localUsers.find((user) => {
                const decryptedEmail = decryptData(user.encrypted_email);
                return decryptedEmail && decryptedEmail.trim().toLowerCase() === sanitizedEmail;
            });

            if (matchedUser) {
                matchedUserId = matchedUser.user_id;
            }
        } catch (error) {
            console.error("Error retrieving local user_id:", error);
        }
    }

    // 3. Send raw email and otp to server
    const serverResponse = await postApi("/otp/verify-otp", {
        email: sanitizedEmail,
        otp,
        user_id: matchedUserId
    });

    if (!serverResponse || serverResponse.error) {
        throw new Error(serverResponse?.error || "Server verification failed.");
    }

    // 4. Update local SQLite using user_id AFTER server verification succeeds
    if (db && matchedUserId) {
        await markUserAsVerifiedLocally(db, matchedUserId);
    }

    return serverResponse;
};