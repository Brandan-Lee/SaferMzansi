import {
	encryptData,
	decryptData,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";

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
		`UPDATE Local_Emergency_Contacts SET is_synched = 1 WHERE contact_id = ?`,
		[contactId],
	);
};

export const markContactAsUnSynched = async (db, contactId) => {
	await db.runAsync(
		`UPDATE Local_Emergency_Contacts SET is_synched = 0 WHERE contact_id = ?`,
		[contactId],
	);
};

// Debugging helper to log local emergency contacts in full detail
export const logLocalEmergencyContactsDatabase = async (db) => {
	try {
		const contacts = await db.getAllAsync(
			"SELECT * FROM Local_Emergency_Contacts",
		);

		console.log(
			"\n================ [SQLITE LOCAL EMERGENCY CONTACTS] ================",
		);

		if (!contacts || contacts.length === 0) {
			console.log("No contact records found in Local_Emergency_Contacts.");
		} else {
			console.log(`Total Contacts: ${contacts.length}\n`);

			contacts.forEach((contact, index) => {
				const decryptField = (value) => {
					if (!value) return value;
					try {
						return decryptData(value) || value;
					} catch {
						return `[Decryption Failed: ${value}]`;
					}
				};

				const decryptedContact = {
					...contact,
					_decrypted_contact_name: decryptField(contact.encrypted_contact_name),
					_decrypted_contact_surname: decryptField(
						contact.encrypted_contact_surname,
					),
					_decrypted_contact_email: decryptField(
						contact.encrypted_contact_email,
					),
					_decrypted_contact_phone_num: decryptField(
						contact.encrypted_contact_phone_num,
					),
				};

				console.log(`--- Contact #${index + 1} ---`);
				console.log(JSON.stringify(decryptedContact, null, 2));
				console.log("----------------------------------------\n");
			});
		}
		console.log(
			"========================================================================\n",
		);
	} catch (error) {
		console.error("Failed to log Local_Emergency_Contacts database:", error);
	}
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
		    deleted_at = ?
		WHERE contact_id = ? AND user_id = ?
	`;

	await db.runAsync(query, [now, contactId, userId]);
};

export const getLocalContactTotal = async (db, userId) => {

	if (!userId) {
		throw new Error("There is no User Id to search the database");
	}

	const countQuery = `SELECT COUNT(*) AS total_contacts FROM Local_Emergency_Contacts WHERE user_id = ? AND (is_deleted = 0 OR deleted_at IS NULL)`;
	const result = await db.getFirstAsync(countQuery, [userId]);
	console.log("From the Repository: ", result?.total_contacts ?? 0);
	return result?.total_contacts ?? 0;
};

export const findContactByEmail = async (db, targetEmail) => {
	if (!targetEmail) {
		throw new Error(
			"contactId is required to find an emergency contact by their email index.",
		);
	}

	const blindIndex = generateBlindIndex(targetEmail);
	const query = `SELECT * FROM Local_Emergency_Contacts WHERE contact_email_blind_index = ? AND is_deleted = 0 LIMIT 1`;
	const results = await db.getAllAsync(query, [blindIndex]);
	return results.length > 0 ? results[0] : null;
};
