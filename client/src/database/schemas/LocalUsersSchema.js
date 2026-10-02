// Local SQLite Schema
import { COMMON_SYNC_COLUMNS, createSyncIndex } from "../constants.js";

export const LOCAL_USERS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Users (
        user_id TEXT PRIMARY KEY NOT NULL,
        email_blind_index TEXT UNIQUE NOT NULL,
        encrypted_name TEXT NOT NULL,
        encrypted_surname TEXT NOT NULL,
        encrypted_email TEXT NOT NULL,
        encrypted_phone_num TEXT NOT NULL,
        is_verified INTEGER NOT NULL DEFAULT 0,
        ${COMMON_SYNC_COLUMNS}
    );

    CREATE INDEX IF NOT EXISTS idx_local_users_email_blind_index 
    ON Local_Users(email_blind_index);

    ${createSyncIndex("Local_Users")}
`;