import {
	decryptData,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";

const normalizeEmail = (email) =>
	String(email ?? "")
		.trim()
		.toLowerCase();

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
		"SELECT user_id, encrypted_email, encrypted_name FROM Local_Users WHERE is_deleted = 0",
	);
};

//Method to insert a user into the local SQLite database Local_Users Table
export const insertLocalUser = async (db, user) => {
	const {
		userId,
		emailBlindIndex,
		encryptedName,
		encryptedSurname,
		encryptedEmail,
		encryptedPhoneNum,
	} = user;

	//Data that has to be sent to the SQLite table
	await db.runAsync(
		`INSERT INTO Local_Users (
            user_id,
            email_blind_index,
            encrypted_name,
            encrypted_surname,
            encrypted_email,
            encrypted_phone_num,
            is_verified,
            is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
		[
			userId,
			emailBlindIndex,
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
	await updateLocalUserField(db, userId, { is_synched: 0 });
};

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
	if (!targetEmail) {
		return null;
	}

	const blindIndex = generateBlindIndex(targetEmail);
	const query = "SELECT * FROM Local_Users WHERE email_blind_index = ? LIMIT 1";
	const results = await db.getAllAsync(query, [blindIndex]);
	return results.length > 0 ? results[0] : null;
};

export const saveOrUpdateLocalUser = async (db, userData) => {
	const {
		userId,
		emailBlindIndex,
		encryptedName,
		encryptedSurname,
		encryptedEmail,
		encryptedPhoneNum,
		isVerified,
		createdAt,
		updatedAt,
		deletedAt = null,
		isSynched = 0,
		isDeleted = 0,
	} = userData;

	if (!userId || !emailBlindIndex) {
		throw new Error(
			"userId and emailBlindIndex are required to save or update a local user.",
		);
	}

	const query = `
		INSERT INTO Local_Users (
			user_id,
			email_blind_index,
			encrypted_name,
			encrypted_surname,
			encrypted_email,
			encrypted_phone_num,
			is_verified,
			is_synched,
			is_deleted,
			created_at,
			updated_at,
			deleted_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			email_blind_index = excluded.email_blind_index,
			encrypted_name = excluded.encrypted_name,
			encrypted_surname = excluded.encrypted_surname,
			encrypted_email = excluded.encrypted_email,
			encrypted_phone_num = excluded.encrypted_phone_num,
			is_verified = excluded.is_verified,
			is_synched = excluded.is_synched,
			is_deleted = excluded.is_deleted,
			updated_at = excluded.updated_at,
			deleted_at = excluded.deleted_at
	`;

	const params = [
		userId,
		emailBlindIndex,
		encryptedName,
		encryptedSurname,
		encryptedEmail,
		encryptedPhoneNum,
		isVerified,
		isSynched,
		isDeleted,
		createdAt,
		updatedAt,
		deletedAt,
	];

	await db.runAsync(query, params);
};
