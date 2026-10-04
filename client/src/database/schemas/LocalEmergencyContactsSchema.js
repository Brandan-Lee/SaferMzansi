import { COMMON_SYNC_COLUMNS, createSyncIndex } from "../constants";

export const LOCAL_EMERGENCY_CONTACTS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Emergency_Contacts (
        contact_id TEXT PRIMARY KEY NOT NULL,
        contact_email_blind_index TEXT NULL DEFAULT NULL,
        user_id TEXT NOT NULL,
        encrypted_contact_name TEXT NOT NULL,
        encrypted_contact_surname TEXT NOT NULL,
        encrypted_contact_phone_num TEXT NOT NULL,
        encrypted_contact_email TEXT NULL DEFAULT NULL,
        ${COMMON_SYNC_COLUMNS},
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_local_emergency_contacts_email_blind_index 
    ON Local_Emergency_Contacts(contact_email_blind_index);

    ${createSyncIndex("Local_Emergency_Contacts", "created_at")}
`;