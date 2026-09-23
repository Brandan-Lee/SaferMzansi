import { COMMON_SYNC_COLUMNS, createSyncIndex } from "../constants.js";

export const LOCAL_USERS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Users (
                user_id TEXT PRIMARY KEY NOT NULL,
                encrypted_name TEXT NOT NULL,
                encrypted_surname TEXT NOT NULL,
                encrypted_email TEXT NOT NULL,
                encrypted_phone_num TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                is_verified INTEGER NOT NULL DEFAULT 0,
                ${COMMON_SYNC_COLUMNS}
            );

            ${createSyncIndex("Local_Users")}
    `;
