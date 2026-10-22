import * as Crypto from "expo-crypto";
import {
	encryptPayload,
	generateBlindIndex,
} from "@utils/securityAndValidation/securityUtil";
import { postApi, safeApiCall } from "@services/ApiClient";
import {
	findUserByEmail,
	insertLocalUser,
	markUserAsSynched,
	markUserAsVerifiedLocally,
	saveOrUpdateLocalUser,
} from "@database/repositories/userRepository";
import {
	saveOrUpdateLocalEmergencyContact,
	markContactAsSynched,
} from "@database/repositories/contactRepository";
import { getAuthToken, saveToken } from "@utils/auth/authTokenUtil";
import {
	saveOrUpdateLocalEvidence,
	markEvidenceAsSynched,
} from "@database/repositories/evidenceRepository";
import { saveOrUpdateLocalIncident } from "@database/repositories/incidentRepository";
import { saveOrUpdateLocalIncidentLocation } from "@database/repositories/incidentLocationRepository";

const normalizeEmail = (email) =>
	String(email ?? "")
		.trim()
		.toLowerCase();

// Helper to hash password using expo-crypto for offline verification
const hashPasswordLocal = async (password) => {
	return await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		password,
	);
};

// Service to handle user registration
export const registerUser = async (db, userData) => {
	const { name, surname, email, phoneNum, password } = userData;

	let existingUser = null;
	try {
		existingUser = await findUserByEmail(db, email);
	} catch (dbErr) {
		console.warn("[User Service] Local DB check error:", dbErr);
	}

	if (existingUser) {
		throw new Error(
			"A user with this email has already been registered on this device",
		);
	}

	const userId = Crypto.randomUUID();
	const emailBlindIndex = generateBlindIndex(email);
	const encryptedData = encryptPayload({ name, surname, email, phoneNum });

	const apiPayload = {
		user_id: userId,
		email_blind_index: emailBlindIndex,
		encrypted_name: encryptedData.name,
		encrypted_surname: encryptedData.surname,
		encrypted_email: encryptedData.email,
		encrypted_phone_num: encryptedData.phoneNum,
		password,
	};

	const result = await safeApiCall(
		() => postApi("/auth/register", apiPayload),
		"Server registration failed. Please try again",
	);

	if (!result?.success || !result?.data?.token) {
		console.warn("[User Service] Backend register error:", result?.error);
		throw new Error(result?.error || "Server registration failed.");
	}

	const localPasswordHash = await hashPasswordLocal(password);

	const localPayload = {
		userId,
		emailBlindIndex,
		encryptedName: encryptedData.name,
		encryptedSurname: encryptedData.surname,
		encryptedEmail: encryptedData.email,
		encryptedPhoneNum: encryptedData.phoneNum,
		passwordHash: localPasswordHash,
	};

	try {
		await insertLocalUser(db, localPayload);
		await markUserAsVerifiedLocally(db, userId);
		await markUserAsSynched(db, userId);
	} catch (localDbErr) {
		console.error("[User Service] Failed to sync local SQLite DB:", localDbErr);
	}

	try {
		await saveToken(result.data.token);
	} catch (tokenErr) {
		console.error("[User Service] Failed to save token:", tokenErr);
	}

	return {
		userId,
		email: normalizeEmail(email),
		token: result.data.token,
		success: true,
	};
};

export const loginUser = async (db, email, password) => {
	if (!email || !password) {
		throw new Error("Email and password are required for login");
	}

	const emailBlindIndex = generateBlindIndex(email);

	let token = await getAuthToken();
	let localUser = await findUserByEmail(db, email);
	let isOffline = false;

	const response = await safeApiCall(
		() =>
			postApi("/auth/login", {
				email_blind_index: emailBlindIndex,
				password,
			}),
		"Server login failed. Please try again",
	);

	if (response.success && response.data?.token) {
		token = response.data.token;
		await saveToken(token);

		const serverUser = response.data.user;
		const serverContacts = response.data.contacts || [];
		const serverEvidence = response.data.evidence || [];
		const serverIncidents = response.data.incidents || [];
		const serverLocations =
			response.data.incident_locations || response.data.locations || [];

		const localPasswordHash = await hashPasswordLocal(password);

		// 1. Sync User Record to local SQLite
		if (serverUser) {
			await saveOrUpdateLocalUser(db, {
				userId: serverUser.user_id,
				emailBlindIndex: serverUser.email_blind_index,
				encryptedName: serverUser.encrypted_name,
				encryptedSurname: serverUser.encrypted_surname,
				encryptedEmail: serverUser.encrypted_email,
				encryptedPhoneNum: serverUser.encrypted_phone_num,
				passwordHash: localPasswordHash,
				createdAt: serverUser.created_at,
				updatedAt: serverUser.updated_at,
				deletedAt: serverUser.deleted_at,
				isDeleted: serverUser.is_deleted ? 1 : 0,
				isVerified: serverUser.is_verified ? 1 : 0,
			});

			await markUserAsSynched(db, serverUser.user_id);
		}

		// 2. Sync Emergency Contacts
		if (Array.isArray(serverContacts) && serverContacts.length > 0) {
			for (const contact of serverContacts) {
				const contactId = contact.contact_id || contact.id;
				const contactEmailBlindIndex =
					contact.contact_email_blind_index ||
					contact.email_blind_index ||
					contact.emailBlindIndex;

				const localContactPayload = {
					contactId,
					userId: serverUser.user_id,
					emailBlindIndex: contactEmailBlindIndex,
					encryptedName:
						contact.encrypted_contact_name || contact.encryptedName,
					encryptedSurname:
						contact.encrypted_contact_surname || contact.encryptedSurname,
					encryptedPhoneNum:
						contact.encrypted_contact_phone_num ||
						contact.encryptedPhoneNum ||
						contact.encryptedPhone,
					encryptedEmail:
						contact.encrypted_contact_email || contact.encryptedEmail,
					createdAt: contact.created_at || new Date().toISOString(),
					updatedAt: contact.updated_at || new Date().toISOString(),
					isSynched: 1,
					isDeleted: contact.is_deleted ? 1 : 0,
				};

				try {
					await saveOrUpdateLocalEmergencyContact(
						db,
						serverUser.user_id,
						localContactPayload,
					);
					await markContactAsSynched(db, contactId);
				} catch (contactErr) {
					console.error(
						`[Auth Service] Failed to sync contact ${contactId} to SQLite:`,
						contactErr,
					);
				}
			}
		}

		// 3. Sync Evidence Vault
		if (Array.isArray(serverEvidence) && serverEvidence.length > 0) {
			for (const evidence of serverEvidence) {
				const evidenceId = evidence.evidence_id || evidence.id;

				const localEvidencePayload = {
					evidenceId,
					userId: serverUser.user_id,
					fileType: evidence.file_type || "application/octet-stream",
					localFileUrl: evidence.local_file_url || "",
					cloudFileUrl: evidence.cloud_file_url || evidence.file_url || "",
					sha256Hash: evidence.sha256_hash || "",
					fileSize: evidence.file_size || 0,
					isSynched: 1,
					isDeleted: evidence.is_deleted ? 1 : 0,
				};

				try {
					await saveOrUpdateLocalEvidence(
						db,
						serverUser.user_id,
						localEvidencePayload,
					);
					await markEvidenceAsSynched(db, evidenceId);
				} catch (evidenceErr) {
					console.error(
						`[Auth Service] Failed to sync evidence ${evidenceId} to SQLite:`,
						evidenceErr,
					);
				}
			}
		}

		// 4. Sync Incidents via Repository
		if (Array.isArray(serverIncidents) && serverIncidents.length > 0) {
			for (const incident of serverIncidents) {
				const incidentId = incident.incident_id || incident.id;
				try {
					await saveOrUpdateLocalIncident(db, serverUser.user_id, {
						incidentId,
						userId: serverUser.user_id,
						evidenceId: incident.evidence_id || null,
						triggerType: incident.trigger_type || "PANIC_BUTTON",
						status: incident.status || "ACTIVE",
						trackingToken: incident.tracking_token || null,
						startTime: incident.start_time || new Date().toISOString(),
						endTime: incident.end_time || null,
						isSynched: 1,
						isDeleted: incident.is_deleted ? 1 : 0,
					});
				} catch (incErr) {
					console.error(
						`[Auth Service] Failed to sync incident ${incidentId} to SQLite:`,
						incErr,
					);
				}
			}
		}

		// 5. Sync Incident Locations via Repository
		if (Array.isArray(serverLocations) && serverLocations.length > 0) {
			for (const loc of serverLocations) {
				const locationId = loc.location_id || loc.id;
				const incidentId = loc.incident_id;
				try {
					await saveOrUpdateLocalIncidentLocation(
						db,
						incidentId,
						{
							latitude: loc.latitude,
							longitude: loc.longitude,
							coordinates: loc.coordinates,
							altitude: loc.altitude || null,
							accuracy: loc.accuracy || null,
							isSynched: 1,
							isDeleted: loc.is_deleted ? 1 : 0,
						},
						locationId,
					);
				} catch (locErr) {
					console.error(
						`[Auth Service] Failed to sync location ${locationId} to SQLite:`,
						locErr,
					);
				}
			}
		}
	} else if (response.status === 0) {
		isOffline = true;

		if (!localUser) {
			throw new Error(
				"No local user found for offline login. Please connect to the internet and try again.",
			);
		}

		if (!localUser.password_hash) {
			throw new Error(
				"Offline authentication credentials are missing. Please connect online once to sync.",
			);
		}

		const inputPasswordHash = await hashPasswordLocal(password);
		if (inputPasswordHash !== localUser.password_hash) {
			throw new Error(
				"Invalid credentials. Please check your password and try again.",
			);
		}

		if (!token) {
			token = `offline_token_${localUser.user_id}`;
			await saveToken(token);
		}
	} else {
		throw new Error(response.error || "Server login failed. Please try again");
	}

	return {
		userId: localUser?.user_id || response.data?.user?.user_id,
		userName: localUser?.encrypted_name || response.data?.user?.encrypted_name,
		email: normalizeEmail(email),
		user: localUser || response.data?.user,
		token,
		isOffline,
	};
};

// Service to handle Forgot password request of the user
export const forgotPasswordUser = async (email) => {
	if (!email) {
		throw new Error("Email is required for password reset");
	}

	const normalEmail = normalizeEmail(email);
	const emailBlindIndex = generateBlindIndex(normalEmail);

	return safeApiCall(
		() =>
			postApi("/auth/forgot-password", {
				email_blind_index: emailBlindIndex,
				email: normalEmail,
			}),
		"We'll send an OTP to this email if the user exists.",
	);
};

// Service to handle user reset password operations
export const resetPasswordUser = async (db, password, email, resetToken) => {
	if (!password || !email || !resetToken) {
		throw new Error(
			"Password, email, and reset token are required for password reset",
		);
	}

	const normalEmail = normalizeEmail(email);
	const emailBlindIndex = generateBlindIndex(normalEmail);

	const result = await safeApiCall(
		() =>
			postApi("/auth/reset-password", {
				email_blind_index: emailBlindIndex,
				password,
				reset_token: resetToken,
			}),
		"There was an error updating your password",
	);

	if (!result.success) {
		throw new Error(result.error);
	}

	const serverUser = result.data?.user;
	const serverIncidents = result.data?.incidents || [];
	const serverLocations =
		result.data?.incident_locations || result.data?.locations || [];

	if (serverUser) {
		const localPasswordHash = await hashPasswordLocal(password);

		await saveOrUpdateLocalUser(db, {
			userId: serverUser.user_id,
			emailBlindIndex: serverUser.email_blind_index,
			encryptedName: serverUser.encrypted_name,
			encryptedSurname: serverUser.encrypted_surname,
			encryptedEmail: serverUser.encrypted_email,
			encryptedPhoneNum: serverUser.encrypted_phone_num,
			passwordHash: localPasswordHash,
			createdAt: serverUser.created_at,
			updatedAt: serverUser.updated_at,
			deletedAt: serverUser.deleted_at,
			isDeleted: serverUser.is_deleted ? 1 : 0,
			isVerified: serverUser.is_verified ? 1 : 0,
		});

		await markUserAsSynched(db, serverUser.user_id);
	}

	// Sync Incidents via Repository on Reset Password
	if (
		Array.isArray(serverIncidents) &&
		serverIncidents.length > 0 &&
		serverUser
	) {
		for (const incident of serverIncidents) {
			const incidentId = incident.incident_id || incident.id;
			try {
				await saveOrUpdateLocalIncident(db, serverUser.user_id, {
					incidentId,
					userId: serverUser.user_id,
					evidenceId: incident.evidence_id || null,
					triggerType: incident.trigger_type || "PANIC_BUTTON",
					status: incident.status || "ACTIVE",
					trackingToken: incident.tracking_token || null,
					startTime: incident.start_time || new Date().toISOString(),
					endTime: incident.end_time || null,
					isSynched: 1,
					isDeleted: incident.is_deleted ? 1 : 0,
				});
			} catch (err) {
				console.error(
					`[Auth Service] Failed to sync incident during reset password:`,
					err,
				);
			}
		}
	}

	// Sync Incident Locations via Repository on Reset Password
	if (Array.isArray(serverLocations) && serverLocations.length > 0) {
		for (const loc of serverLocations) {
			const locationId = loc.location_id || loc.id;
			const incidentId = loc.incident_id;
			try {
				await saveOrUpdateLocalIncidentLocation(
					db,
					incidentId,
					{
						latitude: loc.latitude,
						longitude: loc.longitude,
						coordinates: loc.coordinates,
						altitude: loc.altitude || null,
						accuracy: loc.accuracy || null,
						isSynched: 1,
						isDeleted: loc.is_deleted ? 1 : 0,
					},
					locationId,
				);
			} catch (err) {
				console.error(
					`[Auth Service] Failed to sync incident location during reset password:`,
					err,
				);
			}
		}
	}

	return {
		success: true,
		message: result.data?.message || "Password updated successfully",
	};
};
