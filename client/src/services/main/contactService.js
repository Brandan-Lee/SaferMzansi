import * as Crypto from "expo-crypto";
import {
	encryptData,
	decryptData,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	saveOrUpdateLocalEmergencyContact,
	getLocalEmergencyContacts,
	markContactAsUnSynched,
	softDeleteLocalEmergencyContact,
	getLocalContactTotal,
} from "@database/repositories/contactRepository";

// Service to handle adding or updating an emergency contact
export const addEmergencyContact = async (db, userId, contactData) => {
	const { firstName, surname, phone, email } = contactData;

	if (!userId) {
		throw new Error("User session is required to add an emergency contact.");
	}

	if (!firstName || !surname || (!phone && !email)) {
		throw new Error(
			"Name, surname, and at least a phone number or email are required.",
		);
	}

	const contactCount = await getLocalContactTotal(db, userId);

	if (contactCount >= 5) {
		throw new Error("Maximum number of contacts added.");
	}

	const contactId = Crypto.randomUUID();
	const cleanEmail = email ? email.trim().toLowerCase() : null;
	const contactEmailBlindIndex = cleanEmail
		? generateBlindIndex(cleanEmail)
		: null;

	const encryptedContactName = encryptData(firstName.trim());
	const encryptedContactSurname = encryptData(surname.trim());
	const encryptedContactPhoneNum = encryptData(
		phone ? phone.replace(/[\s-]/g, "") : "",
	);
	const encryptedContactEmail = cleanEmail ? encryptData(cleanEmail) : null;

	const now = new Date().toISOString();

	const apiPayload = {
		contact_id: contactId,
		user_id: userId,
		contact_email_blind_index: contactEmailBlindIndex,
		encrypted_contact_name: encryptedContactName,
		encrypted_contact_surname: encryptedContactSurname,
		encrypted_contact_phone_num: encryptedContactPhoneNum,
		encrypted_contact_email: encryptedContactEmail,
	};

	let isSynched = 1;
	const result = await safeApiCall(
		() => postApi("/contacts/add", apiPayload),
		"Server failed to save contact. Saving locally for offline sync.",
	);

	if (!result?.success) {
		console.warn(
			"[Contact Service] Backend sync failed, saving locally as offline:",
			result?.error,
		);
		isSynched = 0;
	}

	const localContactPayload = {
		id: contactId,
		firstName: firstName.trim(),
		surname: surname.trim(),
		phone: phone ? phone.replace(/[\s-]/g, "") : "",
		email: cleanEmail || "",
		createdAt: now,
		updatedAt: now,
		isSynched: isSynched,
		isDeleted: 0,
	};

	try {
		await saveOrUpdateLocalEmergencyContact(db, userId, localContactPayload);
	} catch (localDbErr) {
		console.error(
			"[Contact Service] Failed to save contact to local SQLite DB:",
			localDbErr,
		);
		throw new Error("Failed to save emergency contact locally.");
	}

	return {
		success: true,
		contactId,
		isSynched: isSynched === 1,
		message: "Contact added successfully.",
	};
};

export const getEmergencyContacts = async (db, userId) => {
	if (!userId) throw new Error("User ID is required.");

	const res = await safeApiCall(
		() => postApi("/contacts/get-contacts", { user_id: userId }),
		"Could not load server contacts.",
	);

	const serverContacts = Array.isArray(res.data)
		? res.data
		: Array.isArray(res.data?.contacts)
			? res.data.contacts
			: Array.isArray(res.data?.data?.contacts)
				? res.data.data.contacts
				: null;

	const isFromServer = res.success && Boolean(serverContacts);

	const rawList = isFromServer
		? serverContacts
		: (await getLocalEmergencyContacts(db, userId).catch(() => [])) || [];

	const safeDecrypt = (val, fieldName) => {
		if (!val) return "";
		try {
			const decrypted = decryptData(val);
			if (decrypted) return decrypted;
			return val;
		} catch (err) {
			console.error(`[DEBUG] Decryption failed for field ${fieldName}:`, err);
			return val;
		}
	};

	const contacts = rawList.map((c, index) => {
		const contactId = c.contactId || c.contact_id || c.id;

		const firstName =
			safeDecrypt(c.encrypted_contact_name, "firstName") ||
			c.firstName ||
			c.first_name ||
			"";
		const surname =
			safeDecrypt(c.encrypted_contact_surname, "surname") ||
			c.surname ||
			c.last_name ||
			"";
		const phone =
			safeDecrypt(c.encrypted_contact_phone_num, "phone") ||
			c.phone ||
			c.phone_number ||
			"";
		const email =
			safeDecrypt(c.encrypted_contact_email, "email") || c.email || "";

		const normalizedName =
			`${firstName} ${surname}`.trim() || c.name || "Unnamed Contact";

		return {
			...c,
			contactId,
			firstName,
			surname,
			name: normalizedName,
			phone,
			email,
		};
	});

	return {
		success: true,
		isOffline: !isFromServer,
		count: contacts.length,
		contacts,
	};
};

export const getTotalContacts = async (db, userId) => {
	if (!userId) {
		throw new Error("Valid user Id required to get the total contacts.");
	}

	const count = await getLocalContactTotal(db, userId);

	console.log("From the service: ", count);

	return count;
}

export const updateEmergencyContact = async (
	db,
	userId,
	contactId,
	contactPayload,
	existingContact = {},
) => {
	if (!contactId) {
		throw new Error("Contact ID is required for update operations");
	}

	if (!contactPayload) {
		throw new Error("Contact payload is required for update operations");
	}

	const { firstName, surname, phone, email } = contactPayload;

	// Normalize input data
	const newFirstName = firstName ? firstName.trim() : "";
	const newSurname = surname ? surname.trim() : "";
	const newPhone = phone ? phone.replace(/[\s-]/g, "") : "";
	const newEmail = email ? email.trim().toLowerCase() : "";

	// Extract existing contact safely
	const existingFirstName = existingContact.firstName
		? existingContact.firstName.trim()
		: "";
	const existingSurname = existingContact.surname
		? existingContact.surname.trim()
		: "";
	const existingPhone = existingContact.phone
		? existingContact.phone.replace(/[\s-]/g, "")
		: "";
	const existingEmail = existingContact.email
		? existingContact.email.trim().toLowerCase() // Added ()
		: "";

	// Re-encrypt values that have changed, or encrypt fresh values
	const encryptedContactName =
		newFirstName !== existingFirstName ||
			!existingContact.encrypted_contact_name
			? encryptData(newFirstName)
			: existingContact.encrypted_contact_name;

	const encryptedContactSurname =
		newSurname !== existingSurname || !existingContact.encrypted_contact_surname
			? encryptData(newSurname)
			: existingContact.encrypted_contact_surname;

	const encryptedContactPhone =
		newPhone !== existingPhone || !existingContact.encrypted_contact_phone_num
			? encryptData(newPhone)
			: existingContact.encrypted_contact_phone_num;

	let emailBlindIndex = existingContact.contact_email_blind_index || null;
	let encryptedContactEmail = existingContact.encrypted_contact_email || null;

	if (newEmail !== existingEmail || !encryptedContactEmail) {
		if (newEmail) {
			emailBlindIndex = generateBlindIndex(newEmail);
			encryptedContactEmail = encryptData(newEmail);
		}
	}

	const now = new Date().toISOString();

	const apiPayload = {
		contact_id: contactId,
		user_id: userId,
		contact_email_blind_index: emailBlindIndex,
		encrypted_contact_name: encryptedContactName,
		encrypted_contact_surname: encryptedContactSurname,
		encrypted_contact_phone_num: encryptedContactPhone,
		encrypted_contact_email: encryptedContactEmail,
	};

	const result = await safeApiCall(
		() => postApi("/contacts/update", apiPayload), // Added leading slash
		"Server failed to update contact. Saving changes locally for offline sync.",
	);

	let isSynched = 1;
	if (!result.success) {
		console.warn(
			"[Contact Service] Backend update failed, updating locally as offline:",
			result?.error,
		);
		isSynched = 0;
		await markContactAsUnSynched(db, contactId);
	}

	const localContactPayload = {
		id: contactId,
		firstName: newFirstName,
		surname: newSurname,
		phone: newPhone,
		email: newEmail,
		updatedAt: now,
		isSynched,
		isDeleted: 0,
	};

	try {
		await saveOrUpdateLocalEmergencyContact(db, userId, localContactPayload);
	} catch (error) {
		console.error("Contact Service failed to update local sqlite db:", error);
		throw new Error("Failed to update Emergency contact locally");
	}

	return {
		success: true,
		contactId,
		// result,
		message: "Contact Updated Successfully",
	};
};

export const deleteEmergencyContact = async (db, contactId, userId) => {
	if (!userId || !contactId) {
		throw new Error(
			"User Id or Contact Id is needed to delete the emergency contact",
		);
	}

	const apiPayload = {
		contact_id: contactId,
		user_id: userId,
	};

	const result = await safeApiCall(
		() => postApi("/contacts/delete", apiPayload),
		"Server failed to delete emergency contact. Saving changes locally for offline sync",
	);

	console.log(result);

	if (!result.success) {
		console.warn(
			"[Contact Service] Backend deletion failed, updating locally as offline:",
			result?.error,
		);

		await markContactAsUnSynched(db, contactId);
	}

	try {
		await softDeleteLocalEmergencyContact(db, userId, contactId);

	} catch (error) {
		console.error("Contact Service failed to delete local sqlite db:", error);
		throw new Error("Failed to delete Emergency contact locally");
	}

	return {
		success: true,
		message: "Contact deleted successfully",
	};
};
