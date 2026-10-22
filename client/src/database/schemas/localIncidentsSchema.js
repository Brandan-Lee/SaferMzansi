import { createSyncIndex } from "../dbConstants";

export const LOCAL_INCIDENTS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Incidents (
        incident_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        evidence_id TEXT NULL,
        trigger_type TEXT NOT NULL,
        status TEXT NOT NULL,
        tracking_token TEXT NULL,
        start_time TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        end_time TEXT NULL DEFAULT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT NULL DEFAULT NULL,
        is_synched INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (evidence_id) REFERENCES Local_Evidence_Vault(evidence_id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_local_incidents_user_id
    ON Local_Incidents(user_id);

    ${createSyncIndex("Local_Incidents", "start_time")}
`;
