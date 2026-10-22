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
	// Enable relationships before creating tables that depend on foreign keys.
	await db.execAsync("PRAGMA foreign_keys = ON;");

	for (const schema of TABLE_SCHEMAS) {
		await db.execAsync(schema);
	}

	// Older installs need this field added without deleting their local data.
	const userColumns = await db.getAllAsync("PRAGMA table_info(Local_Users)");
	if (!userColumns.some((column) => column.name === "offline_password_verifier")) {
		await db.execAsync(
			"ALTER TABLE Local_Users ADD COLUMN offline_password_verifier TEXT",
		);
	}

	if (__DEV__) await logAllLocalTables(db);
};
