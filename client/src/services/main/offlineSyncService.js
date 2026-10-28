import NetInfo from "@react-native-community/netinfo";
import { postApi, safeApiCall } from "@services/ApiClient";
import { syncQueuedEvidence } from "./evidenceSyncService";
import { replaceLocalContactId } from "@database/repositories/contactRepository";

const markSynced = async (db, table, idColumn, id) => {
	await db.runAsync(
		`UPDATE ${table} SET is_synched = 1 WHERE ${idColumn} = ?`,
		[id],
	);
};

const syncUser = async (user) => {
	const result = user.is_deleted
		? await safeApiCall(
				() => postApi("/users/soft-delete", { user_id: user.user_id }),
				"Failed to sync account deactivation.",
			)
		: await safeApiCall(
				() =>
					postApi("/users/update", {
						user_id: user.user_id,
						email_blind_index: user.email_blind_index,
						encrypted_name: user.encrypted_name,
						encrypted_surname: user.encrypted_surname,
						encrypted_phone_num: user.encrypted_phone_num,
						encrypted_email: user.encrypted_email,
					}),
				"Failed to sync user profile.",
			);

	return result;
};

export const syncPendingUserProfile = async (db, userId) => {
	const user = await db.getFirstAsync(
		"SELECT * FROM Local_Users WHERE user_id = ? AND is_synched = 0",
		[userId],
	);
	if (!user) return true;

	const result = await syncUser(user);
	if (!result.success) {
		console.warn(
			`[Offline Sync] User ${user.user_id} remains queued:`,
			result.error,
		);
		return false;
	}

	await markSynced(db, "Local_Users", "user_id", user.user_id);
	return true;
};

const syncUsers = async (db) => {
	const users = await db.getAllAsync(
		`SELECT user_id FROM Local_Users WHERE is_synched = 0 ORDER BY updated_at ASC`,
	);

	for (const user of users) {
		await syncPendingUserProfile(db, user.user_id);
	}
};

const syncContacts = async (db) => {
	const contacts = await db.getAllAsync(
		`SELECT * FROM Local_Emergency_Contacts WHERE is_synched = 0 ORDER BY created_at ASC`,
	);

	for (const contact of contacts) {
		const contactsResult = await safeApiCall(
			() =>
				postApi("/contacts/get-contacts", { user_id: contact.user_id }),
			"Failed to retrieve server contacts for reconciliation.",
		);
		const serverContacts = contactsResult.data?.data?.contacts || [];
		const matchingServerContact = serverContacts.find(
			(serverContact) =>
				contact.contact_email_blind_index &&
				serverContact.user_id === contact.user_id &&
				serverContact.contact_email_blind_index ===
					contact.contact_email_blind_index,
		);
		const canonicalContactId =
			matchingServerContact?.contact_id || contact.contact_id;
		const payload = {
			contact_id: canonicalContactId,
			user_id: contact.user_id,
			contact_email_blind_index: contact.contact_email_blind_index,
			encrypted_contact_name: contact.encrypted_contact_name,
			encrypted_contact_surname: contact.encrypted_contact_surname,
			encrypted_contact_phone_num: contact.encrypted_contact_phone_num,
			encrypted_contact_email: contact.encrypted_contact_email,
		};

		const addResult = await safeApiCall(
			() => postApi("/contacts/add", payload),
			"Failed to sync emergency contact.",
		);
		let result = addResult;
		let resolvedContactId =
			addResult.data?.data?.contact_id || canonicalContactId;

		if (!result.success) {
			result = await safeApiCall(
				() => postApi("/contacts/update", payload),
				"Failed to sync emergency contact update.",
			);
		}

		if (result.success && contact.is_deleted) {
			result = await safeApiCall(
				() =>
					postApi("/contacts/delete", {
						contact_id: resolvedContactId,
						user_id: contact.user_id,
					}),
				"Failed to sync emergency contact deletion.",
			);
		}

		if (result.success) {
			resolvedContactId =
				result.data?.data?.contact_id || resolvedContactId;
			await replaceLocalContactId(
				db,
				contact.contact_id,
				resolvedContactId,
			);
			await markSynced(
				db,
				"Local_Emergency_Contacts",
				"contact_id",
				resolvedContactId,
			);
		} else {
			console.warn(
				`[Offline Sync] Contact ${contact.contact_id} remains queued:`,
				`${result.error}; add response: ${addResult.error || "none"}; contact lookup: ${contactsResult.error || "success"}`,
			);
		}
	}
};

const syncIncidents = async (db) => {
	const incidents = await db.getAllAsync(
		`SELECT * FROM Local_Incidents WHERE is_synched = 0 ORDER BY start_time ASC`,
	);

	for (const incident of incidents) {
		if (incident.evidence_id) {
			const evidence = await db.getFirstAsync(
				`SELECT is_synched FROM Local_Evidence_Vault WHERE evidence_id = ?`,
				[incident.evidence_id],
			);
			if (!evidence?.is_synched) continue;
		}

		const result = await safeApiCall(
			() =>
				postApi("/incidents/add", {
					incident_id: incident.incident_id,
					user_id: incident.user_id,
					evidence_id: incident.evidence_id,
					trigger_type: incident.trigger_type,
					status: incident.status,
					tracking_token: incident.tracking_token,
					start_time: incident.start_time,
					end_time: incident.end_time,
				}),
			"Failed to sync incident.",
		);

		if (result.success) {
			await markSynced(db, "Local_Incidents", "incident_id", incident.incident_id);
		} else {
			console.warn(
				`[Offline Sync] Incident ${incident.incident_id} remains queued:`,
				result.error,
			);
		}
	}
};

const syncIncidentLocations = async (db) => {
	const locations = await db.getAllAsync(
		`SELECT * FROM Local_Incident_Locations WHERE is_synched = 0 ORDER BY created_at ASC`,
	);

	for (const location of locations) {
		const result = await safeApiCall(
			() =>
				postApi("/locations/add", {
					location_id: location.location_id,
					incident_id: location.incident_id,
					latitude: location.latitude,
					longitude: location.longitude,
					altitude: location.altitude,
					accuracy: location.accuracy,
				}),
			"Failed to sync incident location.",
		);

		if (result.success) {
			await markSynced(
				db,
				"Local_Incident_Locations",
				"location_id",
				location.location_id,
			);
		} else {
			console.warn(
				`[Offline Sync] Location ${location.location_id} remains queued:`,
				result.error,
			);
		}
	}
};

export const syncOfflineChanges = async (db) => {
	if (!db) throw new Error("Database is required to sync offline changes.");

	const network = await NetInfo.fetch();
	if (!network.isConnected || network.isInternetReachable === false) {
		return { success: false, error: "No internet connection." };
	}

	await syncUsers(db);
	await syncContacts(db);
	await syncQueuedEvidenceForUsers(db);
	await syncIncidents(db);
	await syncIncidentLocations(db);

	return { success: true };
};

const syncQueuedEvidenceForUsers = async (db) => {
	const rows = await db.getAllAsync(
		`SELECT DISTINCT user_id FROM Local_Evidence_Vault WHERE is_synched = 0`,
	);

	for (const { user_id: userId } of rows) {
		await syncQueuedEvidence(db, userId);
	}
};
