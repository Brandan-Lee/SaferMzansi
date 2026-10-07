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
		id,
		contactId, // Support both naming conventions
		firstName,
		surname,
		phone,
		email,
		createdAt,
		updatedAt,
		isSynched = 0,
		isDeleted = 0,
	} = contactData;

	const resolvedContactId = id || contactId;

	if (!resolvedContactId || !userId) {
		throw new Error(
			"contactId and userId are required to save or update an emergency contact.",
		);
	}

	const cleanEmail = email ? email.trim().toLowerCase() : null;
	const contactEmailBlindIndex = cleanEmail
		? generateBlindIndex(cleanEmail)
		: null;

	// Encrypt sensitive PII fields locally
	const encryptedContactName = encryptData(firstName.trim());
	const encryptedContactSurname = encryptData(surname.trim());
	const encryptedContactPhoneNum = encryptData(
		phone ? phone.replace(/[\s-]/g, "") : "",
	);
	const encryptedContactEmail = cleanEmail ? encryptData(cleanEmail) : null;

	const now = new Date().toISOString();
	const resolvedCreatedAt = createdAt || now;
	const resolvedUpdatedAt = updatedAt || now;

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
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(contact_id) DO UPDATE SET
            contact_email_blind_index = excluded.contact_email_blind_index,
            encrypted_contact_name = excluded.encrypted_contact_name,
            encrypted_contact_surname = excluded.encrypted_contact_surname,
            encrypted_contact_phone_num = excluded.encrypted_contact_phone_num,
            encrypted_contact_email = excluded.encrypted_contact_email,
            is_synched = excluded.is_synched,
            is_deleted = excluded.is_deleted,
            updated_at = excluded.updated_at
    `;

	const params = [
		resolvedContactId,
		userId,
		contactEmailBlindIndex,
		encryptedContactName,
		encryptedContactSurname,
		encryptedContactPhoneNum,
		encryptedContactEmail,
		isSynched,
		isDeleted,
		resolvedCreatedAt,
		resolvedUpdatedAt,
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
	isSynched = 1,
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
		    is_synched = ?,
		    updated_at = ?
		WHERE contact_id = ? AND user_id = ?
	`;

	await db.runAsync(query, [isSynched, now, contactId, userId]);
};
