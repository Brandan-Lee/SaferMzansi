const LOCAL_TABLES = [
	"Local_Users",
	"Local_Emergency_Contacts",
	"Local_Evidence_Vault",
	"Local_Incidents",
	"Local_Incident_Locations",
];

export const logLocalTable = async (db, tableName) => {
	if (!LOCAL_TABLES.includes(tableName)) {
		throw new Error(`Unknown local SQLite table: ${tableName}`);
	}

	// Log schema and row count only; SQLite rows can contain credentials or personal data.
	const [columns, result] = await Promise.all([
		db.getAllAsync(`PRAGMA table_info(${tableName})`),
		db.getFirstAsync(`SELECT COUNT(*) AS row_count FROM ${tableName}`),
	]);
	console.log(`[Local SQLite] ${tableName}:`, {
		rows: result?.row_count ?? 0,
		columns: columns.map((column) => column.name),
	});
};

export const logAllLocalTables = async (db) => {
	await Promise.all(LOCAL_TABLES.map((tableName) => logLocalTable(db, tableName)));
};
