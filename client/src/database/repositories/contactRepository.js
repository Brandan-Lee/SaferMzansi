import {
	decryptData,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";
import { logLocalTable } from "@database/logLocalTable";

export const logLocalContacts = (db) =>
	logLocalTable(db, "Local_Emergency_Contacts");

// Method to save or update an emergency contact in local SQLite
export const saveOrUpdateLocalEmergencyContact = async (
	db,
	userId,
	contactData,
) => {
	const {
		contactId,
		emailBlindIndex,
		encryptedName,
		encryptedSurname,
		encryptedPhoneNum,
		encryptedPhone,
		encryptedEmail,
		createdAt,
		updatedAt,
		deletedAt = null,
		isSynched = 0,
		isDeleted = 0,
	} = contactData;

	if (!contactId || !emailBlindIndex || !userId) {
		throw new Error(
			"contactId, emailBlindIndex, and userId are required to save or update an emergency contact.",
		);
	}

	const now = new Date().toISOString();
	const resolvedCreatedAt = createdAt || now;
	const resolvedUpdatedAt = updatedAt || now;
	const resolvedPhone = encryptedPhoneNum || encryptedPhone || "";

	const query = `
		INSERT INTO Local_Emergency_Contacts (
			contact_id,
			user_id,
			contact_email_blind_index,
			encrypted_contact_name,
			encrypted_contact_surname,
			encrypted_contact_phone_num,
			encrypted_contact_email,
			is_synched,
			is_deleted,
			created_at,
			updated_at,
			deleted_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(contact_id) DO UPDATE SET
			contact_email_blind_index = excluded.contact_email_blind_index,
			encrypted_contact_name = excluded.encrypted_contact_name,
			encrypted_contact_surname = excluded.encrypted_contact_surname,
			encrypted_contact_phone_num = excluded.encrypted_contact_phone_num,
			encrypted_contact_email = excluded.encrypted_contact_email,
			is_synched = excluded.is_synched,
			is_deleted = excluded.is_deleted,
			updated_at = excluded.updated_at,
			deleted_at = excluded.deleted_at
	`;

	const params = [
		contactId,
		userId,
		emailBlindIndex,
		encryptedName,
		encryptedSurname,
		resolvedPhone,
		encryptedEmail,
		isSynched,
		isDeleted,
		resolvedCreatedAt,
		resolvedUpdatedAt,
		deletedAt,
	];

	await db.runAsync(query, params);
};

// Method to fetch all active emergency contacts for a specific user
export const getLocalEmergencyContacts = async (db, userId) => {
	if (!db || !userId) return [];

	const query = `
        SELECT * FROM Local_Emergency_Contacts 
        WHERE user_id = ? AND is_deleted = 0
    `;
	const rows = await db.getAllAsync(query, [userId]);

	// Decrypt fields for client-side consumption when needed
	return rows.map((contact) => {
		const decryptField = (value) => {
			if (!value) return "";
			try {
				return decryptData(value) || value;
			} catch {
				return "[Decryption Failed]";
			}
		};

		const firstName = decryptField(contact.encrypted_contact_name);
		const surname = decryptField(contact.encrypted_contact_surname);

		return {
			...contact,
			firstName,
			surname,
			name: `${firstName} ${surname}`.trim(),
			phone: decryptField(contact.encrypted_contact_phone_num),
			email: decryptField(contact.encrypted_contact_email),
			contactId: contact.contact_id,
		};
	});
};

// Method to mark a local emergency contact as synched with the server
export const markContactAsSynched = async (db, contactId) => {
	await db.runAsync(
		`UPDATE Local_Emergency_Contacts SET is_synched = 1, updated_at = ? WHERE contact_id = ?`,
		[new Date().toISOString(), contactId],
	);
};

export const markContactAsUnSynched = async (db, contactId) => {
	await db.runAsync(
		`UPDATE Local_Emergency_Contacts SET is_synched = 0 WHERE contact_id = ?`,
		[contactId],
	);
};

export const replaceLocalContactId = async (db, currentId, canonicalId) => {
	if (!currentId || !canonicalId || currentId === canonicalId) return;
	await db.runAsync(
		`UPDATE Local_Emergency_Contacts SET contact_id = ? WHERE contact_id = ?`,
		[canonicalId, currentId],
	);
};

export const softDeleteLocalEmergencyContact = async (
	db,
	userId,
	contactId,
) => {
	if (!contactId || !userId) {
		throw new Error(
			"contactId and userId are required to soft delete an emergency contact.",
		);
	}

	const now = new Date().toISOString();

	const query = `
		UPDATE Local_Emergency_Contacts 
		SET is_deleted = 1,
		    is_synched = 0,
		    deleted_at = ?,
		    updated_at = ?
		WHERE contact_id = ? AND user_id = ?
	`;

	await db.runAsync(query, [now, now, contactId, userId]);
};

export const getLocalContactTotal = async (db, userId) => {
	if (!userId) {
		throw new Error("There is no User Id to search the database");
	}

	const countQuery = `SELECT COUNT(*) AS total_contacts FROM Local_Emergency_Contacts WHERE user_id = ? AND is_deleted = 0`;
	const result = await db.getFirstAsync(countQuery, [userId]);
	return result?.total_contacts ?? 0;
};

export const findContactByEmail = async (db, userId, targetEmail) => {
	if (!userId || !targetEmail) {
		throw new Error(
			"userId and targetEmail are required to find an emergency contact by email index.",
		);
	}

	const blindIndex = generateBlindIndex(targetEmail);
	const query = `SELECT * FROM Local_Emergency_Contacts WHERE user_id = ? AND contact_email_blind_index = ? AND is_deleted = 0 LIMIT 1`;
	const results = await db.getAllAsync(query, [userId, blindIndex]);
	return results.length > 0 ? results[0] : null;
};

export const getPrimaryEmergencyContact = async (db, userId) => {
	if (!db || !userId) return null;

	const query = `
        SELECT * FROM Local_Emergency_Contacts 
        WHERE user_id = ? AND is_deleted = 0
        ORDER BY created_at ASC
        LIMIT 1
    `;
	const row = await db.getFirstAsync(query, [userId]);
	if (!row) return null;

	const decryptField = (value) => {
		if (!value) return "";
		try {
			return decryptData(value) || value;
		} catch {
			return "[Decryption Failed]";
		}
	};

	const firstName = decryptField(row.encrypted_contact_name);
	const surname = decryptField(row.encrypted_contact_surname);

	return {
		...row,
		firstName,
		surname,
		name: `${firstName} ${surname}`.trim(),
		phone_number: decryptField(row.encrypted_contact_phone_num),
		phone: decryptField(row.encrypted_contact_phone_num),
		email: decryptField(row.encrypted_contact_email),
		contactId: row.contact_id,
	};
};
