import { createSyncIndex } from "../constants";

export const LOCAL_EVIDENCE_VAULT_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Evidence_Vault (
        evidence_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        incident_id TEXT NOT NULL,
        file_type TEXT NOT NULL,
        local_file_url TEXT NOT NULL,
        sha256_hash TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        captured_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        deleted at TEXT NULL DEFAULT NULL,
        is_synched INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (incident_id) REFERENCES Local_Incidents(incident_id) ON DELETE CASCADE
    );

    ${createSyncIndex("Local_Evidence_Vault", "captured_at")}
`;