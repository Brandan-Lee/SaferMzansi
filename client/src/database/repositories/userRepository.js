import { generateBlindIndex } from "@utils/securityAndValidation/securityUtil";
import { logLocalTable } from "@database/logLocalTable";

export const logLocalUsers = (db) => logLocalTable(db, "Local_Users");

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

export const updateLocalPasswordVerifier = async (db, userId, verifier) => {
	await updateLocalUserField(db, userId, {
		offline_password_verifier: verifier,
	});
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
		passwordHash,
		offlinePasswordVerifier,
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
			password_hash,
            offline_password_verifier,
            is_verified,
            is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
		[
			userId,
			emailBlindIndex,
			encryptedName,
			encryptedSurname,
			encryptedEmail,
			encryptedPhoneNum,
			passwordHash || offlinePasswordVerifier,
			offlinePasswordVerifier,
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
		passwordHash,
		offlinePasswordVerifier,
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

	const now = new Date().toISOString();
	const resolvedCreatedAt = createdAt || now;
	const resolvedUpdatedAt = updatedAt || now;
	const resolvedPhone = encryptedPhoneNum || "";

	const query = `
		INSERT INTO Local_Users (
			user_id,
			email_blind_index,
			encrypted_name,
			encrypted_surname,
			encrypted_email,
			encrypted_phone_num,
			password_hash,
			offline_password_verifier,
			is_verified,
			is_synched,
			is_deleted,
			created_at,
			updated_at,
			deleted_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id) DO UPDATE SET
			email_blind_index = excluded.email_blind_index,
			encrypted_name = excluded.encrypted_name,
			encrypted_surname = excluded.encrypted_surname,
			encrypted_email = excluded.encrypted_email,
			encrypted_phone_num = excluded.encrypted_phone_num,
			password_hash = COALESCE(excluded.password_hash, Local_Users.password_hash),
			offline_password_verifier = COALESCE(
				excluded.offline_password_verifier,
				Local_Users.offline_password_verifier
			),
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
		resolvedPhone,
		passwordHash,
		offlinePasswordVerifier,
		isVerified,
		isSynched,
		isDeleted,
		resolvedCreatedAt,
		resolvedUpdatedAt,
		deletedAt,
	];

	await db.runAsync(query, params);
};

export const getUserDetails = async (db, userId) => {
	if (!userId) {
		throw new Error("User ID is needed to get user details");
	}

	const query = `SELECT * FROM Local_Users WHERE user_id = ? AND is_deleted = 0`;
	const result = await db.getAllAsync(query, [userId]);
	return result[0] || null;
};

export const markUserAsSoftDeletedLocally = async (db, userId) => {
	const now = new Date().toISOString();
	await updateLocalUserField(db, userId, {
		is_deleted: 1,
		deleted_at: now,
		updated_at: now,
		is_synched: 0,
	});
};

export const deleteUserLocally = async (db, userId) => {
	await db.runAsync(`DELETE FROM Local_Users WHERE user_id = ?`, [userId]);
};

export const restoreUserLocally = async (db, userId) => {
	const now = new Date().toISOString();
	await updateLocalUserField(db, userId, {
		is_deleted: 0,
		deleted_at: null,
		updated_at: now,
		is_synched: 1,
	});
};
