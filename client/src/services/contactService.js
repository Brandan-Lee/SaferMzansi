import * as Crypto from "expo-crypto";
import {
    encryptData,
    generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";
import { postApi, safeApiCall } from "@services/ApiClient";
import { saveOrUpdateLocalEmergencyContact } from "@database/repositories/contactRepository";

// Service to handle adding or updating an emergency contact
export const addEmergencyContact = async (db, userId, contactData) => {
    const { firstName, surname, phone, email } = contactData;

    if (!userId) {
        throw new Error("User session is required to add an emergency contact.");
    }

    if (!firstName || !surname || (!phone && !email)) {
        throw new Error("Name, surname, and at least a phone number or email are required.");
    }

    // 1. Generate unique contact ID & encrypt sensitive PII
    const contactId = Crypto.randomUUID();
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const contactEmailBlindIndex = cleanEmail ? generateBlindIndex(cleanEmail) : null;

    const encryptedContactName = encryptData(firstName.trim());
    const encryptedContactSurname = encryptData(surname.trim());
    const encryptedContactPhoneNum = encryptData(phone ? phone.replace(/[\s-]/g, "") : "");
    const encryptedContactEmail = cleanEmail ? encryptData(cleanEmail) : null;

    const now = new Date().toISOString();

    // 2. Prepare payload for Node.js backend API
    const apiPayload = {
        contact_id: contactId,
        user_id: userId,
        contact_email_blind_index: contactEmailBlindIndex,
        encrypted_contact_name: encryptedContactName,
        encrypted_contact_surname: encryptedContactSurname,
        encrypted_contact_phone_num: encryptedContactPhoneNum,
        encrypted_contact_email: encryptedContactEmail,
    };

    // 3. Attempt posting to backend server using your safeApiCall pattern
    let isSynched = 1;
    const result = await safeApiCall(
        () => postApi("/contacts/add", apiPayload),
        "Server failed to save contact. Saving locally for offline sync.",
    );

    // If API call fails (e.g. offline, status 0, or error), we mark isSynched = 0 
    // so it can be pushed later when connection is restored.
    if (!result?.success) {
        console.warn("[Contact Service] Backend sync failed, saving locally as offline:", result?.error);
        isSynched = 0;
    }

    // 4. Save to local SQLite database repository
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
        console.error("[Contact Service] Failed to save contact to local SQLite DB:", localDbErr);
        throw new Error("Failed to save emergency contact locally.");
    }

    return {
        success: true,
        contactId,
        isSynched: isSynched === 1,
        message: "Contact added successfully.",
    };
};