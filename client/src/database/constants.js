export const COMMON_SYNC_COLUMNS = `
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    deleted_at TEXT NULL DEFAULT NULL,
    is_synched INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
`;

export const createSyncIndex = (tableName, timestampColumn = 'updated_at') => `
    CREATE INDEX IF NOT EXISTS idx_${tableName.toLowerCase()}_synch
    ON ${tableName} (is_synched, ${timestampColumn})
    WHERE is_synched = 0;
`;