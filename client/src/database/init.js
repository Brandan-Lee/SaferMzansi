import { LOCAL_EMERGENCY_CONTACTS_SCHEMA } from "@database/schemas/localEmergencyContactsSchema";
import { LOCAL_EVIDENCE_VAULT_SCHEMA } from "@database/schemas/localEvidenceVaultSchema";
import { LOCAL_INCIDENT_LOCATIONS_SCHEMA } from "@database/schemas/localIncidentLocationsSchema";
import { LOCAL_INCIDENTS_SCHEMA } from "@database/schemas/localIncidentsSchema";
import { LOCAL_USERS_SCHEMA } from "@database/schemas/localUsersSchema";
import { logAllLocalTables } from "@database/logLocalTable";

const TABLE_SCHEMAS = [
	LOCAL_USERS_SCHEMA,
	LOCAL_EVIDENCE_VAULT_SCHEMA,
	LOCAL_INCIDENTS_SCHEMA,
	LOCAL_INCIDENT_LOCATIONS_SCHEMA,
	LOCAL_EMERGENCY_CONTACTS_SCHEMA,
];

export const initDatabase = async (db) => {
	try {
		// Allow foreign key constraints
		await db.execAsync(`PRAGMA foreign_keys = ON;`);

		// Create all tables that are part of the TABLE_SCHEMAS array
		for (const schema of TABLE_SCHEMAS) {
			await db.execAsync(schema);
		}

		if (__DEV__) {
			await logAllLocalTables(db);
		}
	} catch (error) {
		console.error("Error initializing database:", error);
		throw error;
	}
};
