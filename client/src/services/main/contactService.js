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
} from "@database/repositories/contactRepository";

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

    // 3. Attempt posting to backend server using safeApiCall
    let isSynched = 1;
    const result = await safeApiCall(
        () => postApi("/contacts/add", apiPayload),
        "Server failed to save contact. Saving locally for offline sync."
    );

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

export const getEmergencyContacts = async (db, userId) => {
    if (!userId) throw new Error("User ID is required.");

    // 1. Try Server Call
    const res = await safeApiCall(
        () => postApi("/contacts/get-contacts", { user_id: userId }),
        "Could not load server contacts."
    );

    console.log("=== [DEBUG] API RAW RESPONSE ===", JSON.stringify(res, null, 2));

    // Unpack contacts array regardless of nesting structure
    const serverContacts = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.contacts)
            ? res.data.contacts
            : Array.isArray(res.data?.data?.contacts)
                ? res.data.data.contacts
                : null;

    const isFromServer = res.success && Boolean(serverContacts);

    // 2. Resolve Raw Array (Server vs Local SQLite Repository)
    const rawList = isFromServer
        ? serverContacts
        : (await getLocalEmergencyContacts(db, userId).catch(() => [])) || [];

    console.log(`=== [DEBUG] RAW LIST ITEMS (${isFromServer ? "SERVER" : "OFFLINE SQLITE"}) ===`, JSON.stringify(rawList, null, 2));

    // Helper to safely decrypt value or return as-is if already plain text
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

    // 3. Normalize items directly into a clean Array
    const contacts = rawList.map((c, index) => {
        const contactId = c.contactId || c.contact_id || c.id;

        // Try decrypting or reading plain properties
        const firstName = safeDecrypt(c.encrypted_contact_name, "firstName") || c.firstName || c.first_name || "";
        const surname = safeDecrypt(c.encrypted_contact_surname, "surname") || c.surname || c.last_name || "";
        const phone = safeDecrypt(c.encrypted_contact_phone_num, "phone") || c.phone || c.phone_number || "";
        const email = safeDecrypt(c.encrypted_contact_email, "email") || c.email || "";

        const normalizedName = `${firstName} ${surname}`.trim() || c.name || "Unnamed Contact";

        console.log(`=== [DEBUG] CONTACT #${index + 1} PROCESSED ===`, {
            contactId,
            firstName,
            surname,
            normalizedName,
            phone,
            email,
        });

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

export const updateEmergencyContact = async (db, contactId, contactPayload) => {
    if (!contactId) {
        throw new Error("Contact ID is required for update operations");
    }

    const { firstName, surname, phone, email } = contactPayload;
    const cleanEmail = email.trim().toLowerCase();
    const emailBlindIndex = generateBlindIndex(cleanEmail);

    const encryptedData = encryptPayload({ firstName, surname, phone, email });

    const apiPayload = {
        contact_id: contactId,
        encrypted_contact_name: encryptedData.firstName,
        encrypted_contact_surname: encryptedData.surname,
        encrypted_contact_phone_num: encryptedData.phone,
        encrypted_contact_email: encryptedData,
        contact_email_blind_index: emailBlindIndex,
    };

    //Server logic
    const result = await safeApiCall(() => postApi("/contacts/update", apiPayload), "Server ")
};