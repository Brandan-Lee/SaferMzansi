import { createSyncIndex } from "../dbConstants";

export const LOCAL_EVIDENCE_VAULT_SCHEMA = `
     CREATE TABLE IF NOT EXISTS Local_Evidence_Vault (
        evidence_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        file_type TEXT NOT NULL,
        local_file_url TEXT NOT NULL,
        cloud_file_url TEXT NULL,
        sha256_hash TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT NULL DEFAULT NULL,
        captured_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        is_synched INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_local_evidence_vault_user_id
    ON Local_Evidence_Vault(user_id);

    ${createSyncIndex("Local_Evidence_Vault", "captured_at")}
`;
