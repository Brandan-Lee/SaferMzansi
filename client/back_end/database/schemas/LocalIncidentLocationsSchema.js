import { createSyncIndex } from "../constants.js";

export const LOCAL_INCIDENT_LOCATIONS_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Local_Incident_Locations (
        location_id TEXT PRIMARY KEY NOT NULL,
        incident_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL NULL DEFAULT NULL,
        accuracy REAL NULL DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        is_synched INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (incident_id) REFERENCES Local_Incidents(incident_id) ON DELETE CASCADE
    );

    ${createSyncIndex("Local_Incident_Locations", "created_at")}
`;
