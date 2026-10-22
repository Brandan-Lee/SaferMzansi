import {
	getEmergencyTimer,
	getEmergencyUserId,
	saveEmergencyUserId,
	saveEmergencyTimer,
} from "@utils/storage/secureStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import NetInfo from "@react-native-community/netinfo";
import { Linking, Platform } from "react-native";
import {
	saveOrUpdateLocalIncident,
} from "@database/repositories/incidentRepository";
import { insertIncidentLocation } from "@database/repositories/incidentLocationRepository";
import {
	getPrimaryEmergencyContact,
	getLocalEmergencyContacts,
} from "@database/repositories/contactRepository";
import { postIncidentOnline } from "./incidentService";
import { postLocationOnline } from "./incidentLocationService";
import { postApi } from "@services/ApiClient";
import { fetchNearestPoliceStation } from "./geoapifyService";
import { decryptData } from "@utils/securityAndValidation/securityUtil";
import { STORAGE_KEYS } from "@constants/storageKeys";

const isValidLocation = (location) =>
	Number.isFinite(location?.latitude) &&
	Number.isFinite(location?.longitude) &&
	location.latitude >= -90 &&
	location.latitude <= 90 &&
	location.longitude >= -180 &&
	location.longitude <= 180 &&
	(location.latitude !== 0 || location.longitude !== 0);

const prepareEmergencySms = async (contact, message) => {
	if (!contact?.phone_number) return false;
	const separator = Platform.OS === "ios" ? "&" : "?";
	const smsUrl = `sms:${contact.phone_number}${separator}body=${encodeURIComponent(message)}`;
	if (!(await Linking.canOpenURL(smsUrl))) return false;
	await Linking.openURL(smsUrl);
	return true;
};

const openEmergencyDialer = async () => {
	const dialUrl = "tel:112";
	if (!(await Linking.canOpenURL(dialUrl))) return false;
	await Linking.openURL(dialUrl);
	return true;
};

const fetchNearestPoliceQuickly = async (latitude, longitude) => {
	let timeoutId;
	try {
		return await Promise.race([
			fetchNearestPoliceStation(latitude, longitude),
			new Promise((resolve) => {
				timeoutId = setTimeout(() => resolve(null), 500);
			}),
		]);
	} finally {
		clearTimeout(timeoutId);
	}
};

export const updateEmergencyTimerConfig = async (userId, timerSeconds) => {
	if (!userId) {
		throw new Error("User session is required to update emergency settings");
	}

	const parsedTimer = Number(timerSeconds);

	if (!Number.isInteger(parsedTimer) || parsedTimer < 3 || parsedTimer > 30) {
		throw new Error(
			"Please enter a valid emergency countdown between 3 and 30 seconds",
		);
	}

	try {
		const result = await saveEmergencyTimer(parsedTimer);

		if (!result.success) {
			throw new Error("Failed to save emergency timer configuration securely");
		}

		return { success: true, timer: parsedTimer };
	} catch (error) {
		console.error("Failed to save emergency timer configuration:", error);
		throw new Error(
			error.message || "Failed to update emergency timer settings",
		);
	}
};

export const fetchEmergencyTimerConfig = async () => {
	return getEmergencyTimer();
};

/**
 * PHASE 1: Timer expired. Logs incident/location locally, checks connectivity,
 * and executes either offline SMS deep-linking or online server email broadcast + Nominatim.
 */
export const executeEmergencyDispatch = async (
	db,
	userId = null,
	getLocationFn,
	fallbackLocation = null,
) => {
	let emergencyUserId = userId;
	let locationCoords = null;
	let displayName = "The user";
	try {
		if (!emergencyUserId) {
			try {
				emergencyUserId = await getEmergencyUserId();
			} catch (error) {
				console.error(
					"[Emergency Dispatch] Failed to load the local emergency profile:",
					error,
				);
			}
		}
		let localUser = null;
		if (db && emergencyUserId) {
			localUser = await db.getFirstAsync(
				`SELECT user_id, encrypted_name FROM Local_Users
				 WHERE user_id = ? AND is_deleted = 0
				 LIMIT 1`,
				[emergencyUserId],
			);
			if (!localUser) emergencyUserId = null;
		}
		if (!emergencyUserId && db) {
			localUser = await db.getFirstAsync(
				`SELECT user_id FROM Local_Users
				 WHERE is_deleted = 0
				 ORDER BY is_synched DESC, updated_at DESC
				 LIMIT 1`,
			);
			emergencyUserId = localUser?.user_id || null;
			if (emergencyUserId) {
				localUser = await db.getFirstAsync(
					`SELECT user_id, encrypted_name FROM Local_Users
					 WHERE user_id = ? AND is_deleted = 0
					 LIMIT 1`,
					[emergencyUserId],
				);
				await saveEmergencyUserId(emergencyUserId);
			}
		}
		if (!emergencyUserId) {
			const dialerOpened = await openEmergencyDialer();
			return {
				success: dialerOpened,
				emergencyDialerOpened: dialerOpened,
				error: dialerOpened
					? null
					: "No emergency profile or saved contacts are available. Call emergency services.",
			};
		}
		if (localUser?.encrypted_name) {
			try {
				const decryptedName = decryptData(localUser.encrypted_name)?.trim();
				displayName =
					decryptedName ||
					(localUser.encrypted_name.startsWith("U2FsdGVkX1")
						? null
						: localUser.encrypted_name);
			} catch (error) {
				console.warn(
					"[Emergency Dispatch] Could not decrypt the local profile name.",
					error,
				);
			}
		}
		displayName = displayName?.trim() || "The user";

		const savedShareLocation = await AsyncStorage.getItem(
			STORAGE_KEYS.SHARE_LOCATION,
		);
		const isLiveSharingEnabled = savedShareLocation === "true";
		const triggerType = isLiveSharingEnabled
			? "LIVE_PANIC_SHARE"
			: "STANDARD_PANIC";

		// Prefer the location captured when the shake happened; use a fresh fix only
		// when that trigger-time location was not available.
		if (fallbackLocation && isValidLocation(fallbackLocation)) {
			locationCoords = {
				latitude: fallbackLocation.latitude,
				longitude: fallbackLocation.longitude,
				altitude: fallbackLocation.altitude || null,
				accuracy: fallbackLocation.accuracy || null,
			};
		}
		if (!locationCoords && typeof getLocationFn === "function") {
			try {
				const locResult = await getLocationFn(true); // High accuracy
				if (locResult?.success && isValidLocation(locResult.location)) {
					locationCoords = {
						latitude: locResult.location.latitude,
						longitude: locResult.location.longitude,
						altitude: locResult.location.altitude || null,
						accuracy: locResult.location.accuracy || null,
					};
				}
			} catch (error) {
				console.warn(
					"[Emergency Dispatch] Current location failed; using captured trigger location:",
					error,
				);
			}
		}
		if (!locationCoords) {
			locationCoords = {
				latitude: 0,
				longitude: 0,
				altitude: null,
				accuracy: null,
			};
			console.warn(
				"[Emergency Dispatch] No valid location is available; sending alert without coordinates.",
			);
		}
		const incidentId = Crypto.randomUUID();
		const trackingToken = Crypto.randomUUID();
		const locationId = Crypto.randomUUID();
		const startTime = new Date().toISOString();
		let localSaved = false;
		let localSaveError = null;

		try {
			await db.withTransactionAsync(async () => {
				await saveOrUpdateLocalIncident(db, emergencyUserId, {
					incidentId,
					trackingToken,
					evidenceId: null,
					triggerType,
					status: "ACTIVE",
					startTime,
					isSynched: 0,
					isDeleted: 0,
				});

				await insertIncidentLocation(
					db,
					incidentId,
					locationCoords,
					locationId,
				);
			});
			localSaved = true;
		} catch (error) {
			localSaveError = error.message;
			console.error(
				"[Emergency Dispatch] Failed to save emergency locally:",
				error,
			);
		}

		// 3. Check Network Connectivity
		const netState = await NetInfo.fetch();
		const isOnline =
			netState.isConnected && netState.isInternetReachable !== false;

		const mapsLink = `https://maps.google.com/?q=${locationCoords.latitude},${locationCoords.longitude}`;
		const emergencyMessage =
			locationCoords.latitude === 0 && locationCoords.longitude === 0
				? `EMERGENCY! ${displayName} is in danger. Their current location is unavailable.`
				: `EMERGENCY! ${displayName} is in danger. Their current location is: ${mapsLink}`;

		if (!isOnline) {
			// OFFLINE MODE: Deep link native SMS app with primary contact
			let smsOpened = false;
			const primaryContact = await getPrimaryEmergencyContact(
				db,
				emergencyUserId,
			);
			smsOpened = await prepareEmergencySms(primaryContact, emergencyMessage);
			if (!smsOpened) {
				console.warn(
					"[Emergency Dispatch] No primary emergency contact found locally for offline SMS.",
				);
			}
			const emergencyDialerOpened = smsOpened
				? false
				: await openEmergencyDialer();
			return {
				success: smsOpened || emergencyDialerOpened,
				incidentId,
				localSaved,
				smsOpened,
				emergencyDialerOpened,
				localSaveError,
				error:
					smsOpened || emergencyDialerOpened
						? null
						: "No emergency SMS could be prepared and the emergency dialer could not be opened.",
			};
		} else {
			// ONLINE MODE: Background Sync + Nominatim + Server Email Broadcast
			//Query Nominatim and select the station nearest to the incident coordinates
			let nearestPolice = null;
			try {
				if (locationCoords.latitude === 0 && locationCoords.longitude === 0) {
					throw new Error("No valid incident coordinates are available.");
				}
				nearestPolice = await fetchNearestPoliceQuickly(
					locationCoords.latitude,
					locationCoords.longitude,
				);
			} catch (nomErr) {
				console.warn("[Emergency Dispatch] Nominatim lookup warning:", nomErr);
			}

			//Fetch all contacts and trigger backend Nodemailer email broadcast
			const allContacts = await getLocalEmergencyContacts(db, emergencyUserId);
			const contactsWithEmail = allContacts.filter((contact) => contact.email);
			if (contactsWithEmail.length === 0) {
				const [incidentSync, locationSync] = await Promise.all([
					postIncidentOnline(db, {
						incident_id: incidentId,
						user_id: emergencyUserId,
						evidence_id: null,
						trigger_type: triggerType,
						status: "ACTIVE",
						start_time: startTime,
						tracking_token: trackingToken,
					}),
					postLocationOnline(db, {
						location_id: locationId,
						incident_id: incidentId,
						latitude: locationCoords.latitude,
						longitude: locationCoords.longitude,
						altitude: locationCoords.altitude,
						accuracy: locationCoords.accuracy,
					}),
				]);
				const primaryContact = await getPrimaryEmergencyContact(
					db,
					emergencyUserId,
				);
				const smsOpened = await prepareEmergencySms(
					primaryContact,
					emergencyMessage,
				);
				const emergencyDialerOpened = smsOpened
					? false
					: await openEmergencyDialer();
				return {
					success: smsOpened || emergencyDialerOpened,
					incidentId,
					localSaved,
					localSaveError,
					incidentSaved: incidentSync?.success || false,
					locationSaved: locationSync?.success || false,
					smsOpened,
					emergencyDialerOpened,
					error:
						smsOpened || emergencyDialerOpened
							? null
							: "No emergency contact email or phone is available. Call emergency services.",
				};
			}
			// Wait for the dispatch result instead of retrying while emails are sending.
			const broadcastResponse = await postApi(
				"/emergency/broadcast",
				{
					incident_id: incidentId,
					location_id: locationId,
					user_id: emergencyUserId,
					trigger_type: triggerType,
					status: "ACTIVE",
					start_time: startTime,
					tracking_token: trackingToken,
					location: locationCoords,
					contacts: allContacts,
					nearest_police_station: nearestPolice,
					message: emergencyMessage,
				},
				{ timeoutMs: 0 },
			);
			if (!broadcastResponse.ok || !broadcastResponse.data?.success) {
				throw new Error(
					broadcastResponse.data?.error ||
					"The server rejected the emergency broadcast.",
				);
			}
			const emailsSent = broadcastResponse.data.data?.emails_sent ?? 0;
			if (emailsSent === 0) {
				const primaryContact = await getPrimaryEmergencyContact(
					db,
					emergencyUserId,
				);
				const smsOpened = await prepareEmergencySms(
					primaryContact,
					emergencyMessage,
				);
				if (smsOpened) {
					return {
						success: true,
						incidentId,
						localSaved,
						localSaveError,
						smsOpened: true,
						emergencyDialerOpened: false,
						incidentSaved:
							broadcastResponse.data.data?.incident_saved === true,
						locationSaved:
							broadcastResponse.data.data?.location_saved === true,
					};
				}
				const emergencyDialerOpened = await openEmergencyDialer();
				if (emergencyDialerOpened) {
					return {
						success: true,
						incidentId,
						localSaved,
						localSaveError,
						smsOpened: false,
						emergencyDialerOpened: true,
						incidentSaved:
							broadcastResponse.data.data?.incident_saved === true,
						locationSaved:
							broadcastResponse.data.data?.location_saved === true,
					};
				}
				throw new Error(
					broadcastResponse.data.data?.warning ||
					"No emergency contact email could be sent.",
				);
			}

			return {
				success: true,
				incidentId,
				localSaved,
				localSaveError,
				incidentSynced:
					broadcastResponse.data.data?.incident_saved === true,
				locationSynced:
					broadcastResponse.data.data?.location_saved === true,
				incidentSaved:
					broadcastResponse.data.data?.incident_saved === true,
				locationSaved:
					broadcastResponse.data.data?.location_saved === true,
				emailsSent,
				emailsFailed: broadcastResponse.data.data?.emails_failed ?? 0,
				contactsWithoutEmail:
					broadcastResponse.data.data?.contacts_without_email ?? 0,
				smsOpened: false,
			};
		}
	} catch (error) {
		console.error(
			"[Emergency Dispatch] Failed to execute emergency dispatch:",
			error,
		);
		if (db && emergencyUserId) {
			try {
				const primaryContact = await getPrimaryEmergencyContact(
					db,
					emergencyUserId,
				);
				const emergencyLocation =
					locationCoords ||
					(fallbackLocation && isValidLocation(fallbackLocation)
						? fallbackLocation
						: null);
				const mapsLink = emergencyLocation
					? `https://maps.google.com/?q=${emergencyLocation.latitude},${emergencyLocation.longitude}`
					: null;
				const message = mapsLink
					? `EMERGENCY: ${displayName} is in danger. Their location: ${mapsLink}`
					: `EMERGENCY: ${displayName} is in danger. Their current location is unavailable.`;
				const smsOpened = await prepareEmergencySms(primaryContact, message);
				if (smsOpened) {
					return {
						success: true,
						smsOpened: true,
						warning: error.message,
					};
				}
			} catch (fallbackError) {
				console.error(
					"[Emergency Dispatch] SMS fallback failed:",
					fallbackError,
				);
			}
		}
		const dialerOpened = await openEmergencyDialer();
		if (dialerOpened) {
			return {
				success: true,
				emergencyDialerOpened: true,
				warning: error.message,
			};
		}
		return { success: false, error: error.message };
	}
};
