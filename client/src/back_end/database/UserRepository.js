//Method that finds all the user emails from the SQLite database
export const findLocalUserEmails = async (db) => {
	return await db.getAllAsync("SELECT encrypted_email FROM Local_Users");
};

//Method to insert a user into the local SQLite database Local_Users Table
export const insertLocalUser = async (db, user) => {
	const {
		userId,
		encryptedName,
		encryptedSurname,
		encryptedEmail,
		encryptedPhoneNum,
		passwordHash,
	} = user;

	await db.runAsync(
		`INSERT INTO Local_Users (
            user_id,
            encrypted_name,
            encrypted_surname,
            encrypted_email,
            encrypted_phone_num,
            password_hash,
            is_verified,
            is_synched
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
		[
			userId,
			encryptedName,
			encryptedSurname,
			encryptedEmail,
			encryptedPhoneNum,
			passwordHash,
		],
	);
};

//Method to help mark that the local database and the cloud database is synched.
export const markUserAsSynched = async (db, userId) => {
	await db.runAsync(
		`UPDATE Local_Users
            SET is_synched = 1
            WHERE user_id = ?`,
		[userId],
	);
};
