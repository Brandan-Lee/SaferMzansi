import { createSyncIndex } from "../dbConstatns";

export const LOCAL_INCIDENTS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Incidents (
        incident_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        evidence_id NOT NULL,
        trigger_type TEXT NOT NULL,
        status TEXT NOT NULL,
        tracking_token TEXT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT NULL DEFAULT NULL,
        start_time TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        end_time TEXT NULL DEFAULT NULL,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        is_synched INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (evidence_id) REFERENCES LOCAL_EVIDENCE_VAULT_SCHEMA(evidence_id) ON DELETE CASCADE

    );

    ${createSyncIndex("Local_Incidents", "start_time")}
`;
