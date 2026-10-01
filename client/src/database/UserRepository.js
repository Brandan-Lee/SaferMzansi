import { decryptData } from "../utils/SecurityUtil";

const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

//Helper to update local user fields by user id
const updateLocalUserField = async (db, userId, fields) => {
	const assignments = Object.keys(fields)
		.map((key) => `${key} = ?`)
		.join(", ");

	const values = [...Object.values(fields), userId];

	await db.runAsync(
		`UPDATE Local_Users SET ${assignments} WHERE user_id = ?`,
		values,
	);
};

//TODO: Remove this when project is complete
// Method to log all local user records in full detail to the console
export const logLocalUsersDatabase = async (db) => {
	try {
		const users = await db.getAllAsync("SELECT * FROM Local_Users");

		console.log(
			"\n================ [SQLITE LOCAL USERS TABLE - FULL DATA] ================",
		);

		if (!users || users.length === 0) {
			console.log("No user records found in Local_Users.");
		} else {
			console.log(`Total Records: ${users.length}\n`);

			users.forEach((user, index) => {
				// Safely attempt decryption on encrypted fields
				const decryptField = (value) => {
					if (!value) return value;
					try {
						return decryptData(value) || value;
					} catch {
						return `[Decryption Failed: ${value}]`;
					}
				};

				const decryptedUser = {
					...user,
					_decrypted_name: decryptField(user.encrypted_name),
					_decrypted_surname: decryptField(user.encrypted_surname),
					_decrypted_email: decryptField(user.encrypted_email),
					_decrypted_phone_num: decryptField(user.encrypted_phone_num),
				};

				console.log(`--- Record #${index + 1} ---`);
				console.log(JSON.stringify(decryptedUser, null, 2));
				console.log("----------------------------------------\n");
			});
		}

		console.log(
			"========================================================================\n",
		);
	} catch (error) {
		console.error("Failed to log Local_Users database:", error);
	}
};

// Method that finds all local users with their login credentials from SQLite
export const findLocalUserEmails = async (db) => {
	return await db.getAllAsync(
		"SELECT user_id, encrypted_email FROM Local_Users WHERE is_deleted = 0",
	);
};

//Method to insert a user into the local SQLite database Local_Users Table
export const insertLocalUser = async (db, user) => {
	const {
		userId,
		encryptedName,
		encryptedSurname,
		encryptedEmail,
		encryptedPhoneNum,
	} = user;

	//Data that has to be sent to the SQLite table
	await db.runAsync(
		`INSERT INTO Local_Users (
            user_id,
            encrypted_name,
            encrypted_surname,
            encrypted_email,
            encrypted_phone_num,
            is_verified,
            is_synched
        ) VALUES (?, ?, ?, ?, ?, 0, 0)`,
		[
			userId,
			encryptedName,
			encryptedSurname,
			encryptedEmail,
			encryptedPhoneNum,
		],
	);
};

//Method to help mark that the local database and the cloud database is synched.
export const markUserAsSynched = async (db, userId) => {
	await updateLocalUserField(db, userId, { is_synched: 1 });
};

//Method that helps to makrk the is_synched column to false
export const markUserAsUnSynched = async (db, userId) => {
	await updateLocalUserField(db, userId, { is_synched: 0});
}

// Method that marks the user as verified on the local database by user_id
export const markUserAsVerifiedLocally = async (db, userId) => {
	await updateLocalUserField(db, userId, { is_verified: 1, is_synched: 0 });
};

//Method to find a local user id by matching the decrypted email
export const getLocalUserIdByEmail = async (db, rawEmail) => {
	if (!db || !rawEmail) {
		return null;
	}

	const matchedUser = await findUserByEmail(db, rawEmail);
	return matchedUser?.user_id || null;
};

//Helper method to find the user by their email
export const findUserByEmail = async (db, targetEmail) => {
	const normalizedEmail = normalizeEmail(targetEmail);
	const localUsers = await findLocalUserEmails(db);

	return localUsers.find(
		(user) => normalizeEmail(decryptData(user.encrypted_email)) === normalizedEmail,
	);
};
