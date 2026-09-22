import { createSyncIndex } from "../constants";

export const LOCAL_INCIDENTS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Incidents (
        incident_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        status TEXT NOT NULL,
        tracking_token TEXT NULL,
        start_time TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        end_time TEXT NULL DEFAULT NULL,
        is_synched INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE
    );

    ${createSyncIndex("Local_Incidents", "start_time")}
`;
