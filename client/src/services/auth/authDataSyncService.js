import {
	markContactAsSynched,
	saveOrUpdateLocalEmergencyContact,
} from "@database/repositories/contactRepository";
import {
	markEvidenceAsSynched,
	saveOrUpdateLocalEvidence,
} from "@database/repositories/evidenceRepository";
import { saveOrUpdateLocalIncident } from "@database/repositories/incidentRepository";
import { saveOrUpdateLocalIncidentLocation } from "@database/repositories/incidentLocationRepository";
import { markUserAsSynched, saveOrUpdateLocalUser } from "@database/repositories/userRepository";
import { createOfflinePasswordVerifier } from "@utils/securityAndValidation/offlinePasswordUtil";

export const syncServerIncidentsAndLocations = async (
	db,
	userId,
	incidents = [],
	locations = [],
) => {
	for (const incident of incidents) {
		const incidentId = incident.incident_id || incident.id;
		try {
			await saveOrUpdateLocalIncident(db, userId, {
				incidentId,
				userId,
				evidenceId: incident.evidence_id || null,
				triggerType: incident.trigger_type || "PANIC_BUTTON",
				status: incident.status || "ACTIVE",
				trackingToken: incident.tracking_token || null,
				startTime: incident.start_time || new Date().toISOString(),
				endTime: incident.end_time || null,
				isSynched: 1,
				isDeleted: incident.is_deleted ? 1 : 0,
			});
		} catch (error) {
			console.error(
				`[Auth Data Sync] Failed to save incident ${incidentId}:`,
				error,
			);
		}
	}

	for (const location of locations) {
		const locationId = location.location_id || location.id;
		try {
			await saveOrUpdateLocalIncidentLocation(
				db,
				location.incident_id,
				{
					latitude: location.latitude,
					longitude: location.longitude,
					coordinates: location.coordinates,
					altitude: location.altitude || null,
					accuracy: location.accuracy || null,
					isSynched: 1,
					isDeleted: location.is_deleted ? 1 : 0,
				},
				locationId,
			);
		} catch (error) {
			console.error(
				`[Auth Data Sync] Failed to save location ${locationId}:`,
				error,
			);
		}
	}
};

export const syncServerAccount = async (
	db,
	{
		user,
		password,
		existingPasswordHash,
		contacts = [],
		evidence = [],
		incidents = [],
		locations = [],
	},
) => {
	if (!user?.user_id) return;

	const offlinePasswordVerifier =
		await createOfflinePasswordVerifier(password);
	await saveOrUpdateLocalUser(db, {
		userId: user.user_id,
		emailBlindIndex: user.email_blind_index,
		encryptedName: user.encrypted_name,
		encryptedSurname: user.encrypted_surname,
		encryptedEmail: user.encrypted_email,
		encryptedPhoneNum: user.encrypted_phone_num,
		passwordHash: user.password_hash || existingPasswordHash || "",
		offlinePasswordVerifier,
		createdAt: user.created_at,
		updatedAt: user.updated_at,
		deletedAt: user.deleted_at,
		isDeleted: user.is_deleted ? 1 : 0,
		isVerified: user.is_verified ? 1 : 0,
	});
	await markUserAsSynched(db, user.user_id);

	for (const contact of contacts) {
		const contactId = contact.contact_id || contact.id;
		const emailBlindIndex =
			contact.contact_email_blind_index ||
			contact.email_blind_index ||
			contact.emailBlindIndex ||
			null;
		try {
			await saveOrUpdateLocalEmergencyContact(db, user.user_id, {
				contactId,
				userId: user.user_id,
				emailBlindIndex,
				encryptedName:
					contact.encrypted_contact_name || contact.encryptedName,
				encryptedSurname:
					contact.encrypted_contact_surname || contact.encryptedSurname,
				encryptedPhoneNum:
					contact.encrypted_contact_phone_num ||
					contact.encryptedPhoneNum ||
					contact.encryptedPhone ||
					"",
				encryptedEmail:
					contact.encrypted_contact_email || contact.encryptedEmail || null,
				createdAt: contact.created_at || new Date().toISOString(),
				updatedAt: contact.updated_at || new Date().toISOString(),
				isSynched: 1,
				isDeleted: contact.is_deleted ? 1 : 0,
			});
			await markContactAsSynched(db, contactId);
		} catch (error) {
			console.error(
				`[Auth Data Sync] Failed to save contact ${contactId}:`,
				error,
			);
		}
	}

	for (const item of evidence) {
		const evidenceId = item.evidence_id || item.id;
		try {
			await saveOrUpdateLocalEvidence(db, user.user_id, {
				evidenceId,
				userId: user.user_id,
				fileType: item.file_type || "application/octet-stream",
				localFileUrl: item.local_file_url || "",
				cloudFileUrl: item.cloud_file_url || item.file_url || "",
				sha256Hash: item.sha256_hash || "",
				fileSize: item.file_size || 0,
				isSynched: 1,
				isDeleted: item.is_deleted ? 1 : 0,
			});
			await markEvidenceAsSynched(db, evidenceId);
		} catch (error) {
			console.error(
				`[Auth Data Sync] Failed to save evidence ${evidenceId}:`,
				error,
			);
		}
	}

	await syncServerIncidentsAndLocations(db, user.user_id, incidents, locations);
};
