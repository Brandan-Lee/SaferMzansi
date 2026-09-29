import { LOCAL_USERS_SCHEMA } from "./schemas/LocalUsersSchema.js";
import { LOCAL_INCIDENTS_SCHEMA } from "./schemas/LocalIncidentsSchema.js";
import { LOCAL_INCIDENT_LOCATIONS_SCHEMA } from "./schemas/LocalIncidentLocationsSchema.js";
import { LOCAL_EVIDENCE_VAULT_SCHEMA } from "./schemas/LocalEvidenceVaultSchema.js";
import { LOCAL_EMERGENCY_CONTACTS_SCHEMA } from "./schemas/LocalEmergencyContactsSchema.js";
import { DECOY_SCHEMA } from "./schemas/DecoySchema.js";

const TABLE_SCHEMAS = [
	LOCAL_USERS_SCHEMA,
	LOCAL_INCIDENTS_SCHEMA,
	LOCAL_INCIDENT_LOCATIONS_SCHEMA,
	LOCAL_EVIDENCE_VAULT_SCHEMA,
	LOCAL_EMERGENCY_CONTACTS_SCHEMA,
	DECOY_SCHEMA,
];

export const initDatabase = async (db) => {
	try {
		//Allow foreign key constraints
		await db.execAsync(`PRAGMA foreign_keys = ON;`);

		//Create all tables that is part of the TABLE_SCHEMAS array
		for (const schema of TABLE_SCHEMAS) {
			await db.execAsync(schema);
		}

		console.log("Database initialized successfully.");
	} catch (error) {
		console.error("Error initializing database:", error);
	}
};