export const DECOY_SCHEMA = `
    CREATE TABLE IF NOT EXISTS Decoy (
        decoy_id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        decoy_pin_hash TEXT NOT NULL,
        trigger_pin_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        FOREIGN KEY (user_id) REFERENCES Local_Users(user_id) ON DELETE CASCADE
    );
`;