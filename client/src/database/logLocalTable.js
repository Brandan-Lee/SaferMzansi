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
	const rows = await db.getAllAsync(`SELECT * FROM ${tableName}`);
	console.log(`[Local SQLite] ${tableName}:`, JSON.stringify(rows, null, 2));
};

export const logAllLocalTables = async (db) => {
	await Promise.all(LOCAL_TABLES.map((tableName) => logLocalTable(db, tableName)));
};
