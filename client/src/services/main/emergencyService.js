import {
	getEmergencyTimer,
	getEmergencyUserId,
	saveEmergencyTimer,
} from "@utils/storage/secureStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import NetInfo from "@react-native-community/netinfo";
import { Linking, Platform } from "react-native";
import {
	saveOrUpdateLocalIncident,
	updateIncidentOnCancel,
} from "@database/repositories/incidentRepository";
import { insertIncidentLocation } from "@database/repositories/incidentLocationRepository";
import {
	getPrimaryEmergencyContact,
	getLocalEmergencyContacts,
} from "@database/repositories/contactRepository";
import { addEvidence } from "./evidenceService";
import { postIncidentOnline } from "./incidentService";
import { postLocationOnline } from "./incidentLocationService";
import { postApi } from "@services/ApiClient";

const KEYS = {
	SHARE_LOCATION: "@setting_share_location",
	AUDIO_RECORDING: "@setting_auto_record",
};

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

export const updateEmergencyTimerConfig = async (userId, timerSeconds) => {
	if (!userId) {
		throw new Error("User session is required to update emergency settings");
	}

	const parsedTimer = parseInt(timerSeconds, 10);

	if (isNaN(parsedTimer) || parsedTimer < 3 || parsedTimer > 30) {
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
	try {
		const timer = await getEmergencyTimer();
		return timer;
	} catch (error) {
		console.error("Failed to fetch emergency timer configuration:", error);
		return "5";
	}
};

/**
 * PHASE 1: Timer expired. Logs incident/location locally, checks connectivity,
 * and executes either offline SMS deep-linking or online server email broadcast + Nominatim.
 */
export const executeEmergencyDispatch = async (
	db,
	userId = null,
	getLocationFn,
) => {
	try {
		console.log(
			"[Emergency Dispatch] Timer expired. Executing emergency dispatch sequence...",
		);

		let emergencyUserId = userId;
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

		const savedShareLocation = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);
		const isLiveSharingEnabled = savedShareLocation === "true";
		const triggerType = isLiveSharingEnabled
			? "LIVE_PANIC_SHARE"
			: "STANDARD_PANIC";

		// 1. Capture current GPS location
		let locationCoords = {
			latitude: 0.0,
			longitude: 0.0,
			altitude: null,
			accuracy: null,
		};
		if (typeof getLocationFn === "function") {
			const locResult = await getLocationFn(true); // High accuracy
			if (locResult.success && locResult.location) {
				locationCoords = {
					latitude: locResult.location.latitude,
					longitude: locResult.location.longitude,
					altitude: locResult.location.altitude || null,
					accuracy: locResult.location.accuracy || null,
				};
			}
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
			console.error("[Emergency Dispatch] Failed to save emergency locally:", error);
		}

		// 3. Check Network Connectivity
		const netState = await NetInfo.fetch();
		const isOnline =
			netState.isConnected && netState.isInternetReachable !== false;

		const mapsLink = `https://maps.google.com/?q=${locationCoords.latitude},${locationCoords.longitude}`;
		const emergencyMessage = `🚨 EMERGENCY! I am in danger. My current location is: ${mapsLink}`;

		if (!isOnline) {
			// ==========================================
			// OFFLINE MODE: Deep link native SMS app with primary contact
			// ==========================================
			console.log(
				"[Emergency Dispatch] Device is offline. Triggering native SMS fallback...",
			);
			let smsOpened = false;
			const primaryContact = await getPrimaryEmergencyContact(db, emergencyUserId);
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
				error: smsOpened || emergencyDialerOpened
					? null
					: "No emergency SMS could be prepared and the emergency dialer could not be opened.",
			};
		} else {
			// ==========================================
			// ONLINE MODE: Background Sync + Nominatim + Server Email Broadcast
			// ==========================================
			console.log(
				"[Emergency Dispatch] Device is online. Executing full cloud broadcast & sync...",
			);

			// A. Background sync incident & location to server
			const incidentSync = await postIncidentOnline(db, {
				incident_id: incidentId,
				user_id: emergencyUserId,
				evidence_id: null,
				trigger_type: triggerType,
				status: "ACTIVE",
				start_time: startTime,
				tracking_token: trackingToken,
			});
			if (!incidentSync?.success) {
				console.error(
					"[Emergency Dispatch] Incident server sync failed:",
					incidentSync?.error,
				);
			}

			const locationSync = await postLocationOnline(db, {
				location_id: locationId,
				incident_id: incidentId,
				latitude: locationCoords.latitude,
				longitude: locationCoords.longitude,
				altitude: locationCoords.altitude,
				accuracy: locationCoords.accuracy,
			});
			if (!locationSync?.success) {
				console.error(
					"[Emergency Dispatch] Location server sync failed:",
					locationSync?.error,
				);
			}

			// B. Query Nominatim for nearest police station
			let nearestPolice = null;
			try {
				const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=police&lat=${locationCoords.latitude}&lon=${locationCoords.longitude}&limit=1`;
				const nominatimRes = await fetch(nominatimUrl, {
					headers: { "User-Agent": "SaferMzansiEmergencyApp/1.0" },
				});
				const nominatimData = await nominatimRes.json();

				if (nominatimData?.[0]) {
					nearestPolice = {
						name: nominatimData[0].display_name,
						lat: nominatimData[0].lat,
						lon: nominatimData[0].lon,
					};
				}
			} catch (nomErr) {
				console.warn("[Emergency Dispatch] Nominatim lookup warning:", nomErr);
			}

			// C. Fetch all contacts and trigger backend Nodemailer email broadcast
			const allContacts = await getLocalEmergencyContacts(db, emergencyUserId);
			const contactsWithEmail = allContacts.filter((contact) => contact.email);
			if (contactsWithEmail.length === 0) {
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
					incidentSaved: incidentSync.success,
					locationSaved: locationSync.success,
					smsOpened,
					emergencyDialerOpened,
					error:
						smsOpened || emergencyDialerOpened
							? null
							: "No emergency contact email or phone is available. Call emergency services.",
				};
			}
			const broadcastResponse = await postApi("/emergency/broadcast", {
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
			});
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
							incidentSync.success ||
							broadcastResponse.data.data?.incident_saved === true,
						locationSaved:
							locationSync.success ||
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
							incidentSync.success ||
							broadcastResponse.data.data?.incident_saved === true,
						locationSaved:
							locationSync.success ||
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
				incidentSynced: incidentSync.success,
				locationSynced: locationSync.success,
				incidentSaved:
					incidentSync.success ||
					broadcastResponse.data.data?.incident_saved === true,
				locationSaved:
					locationSync.success ||
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
		return { success: false, error: error.message };
	}
};

/**
 * PHASE 2: User presses cancel. Vaults audio via evidenceService[cite: 11] and finalizes incident status.
 */
export const finalizeEmergencyOnCancel = async (
	db,
	incidentId,
	userId,
	audioUri = null,
	finalStatus = "CANCELLED",
) => {
	try {
		console.log("[Emergency Dispatch] Finalizing emergency on cancel/close...");

		const savedAudioSetting = await AsyncStorage.getItem(KEYS.AUDIO_RECORDING);
		const isAudioAllowed = savedAudioSetting === "true";

		let evidenceId = null;
		let serverEvidenceId = null;
		let evidenceError = null;

		// 1. Vault audio if recorded and allowed
		if (isAudioAllowed && audioUri) {
			try {
				const response = await fetch(audioUri);
				const blob = await response.blob();

				const evidencePayload = {
					file_type: "audio/mp4",
					local_file_url: audioUri,
					file_size: blob.size || 0,
					file_name: `emergency_audio_${incidentId || Date.now()}.mp4`,
				};

				// Leverages full evidenceService pipeline (Supabase bucket + local vault + API post)[cite: 11]
				const evidenceResult = await addEvidence(db, userId, evidencePayload);
				if (evidenceResult?.success) {
					evidenceId = evidenceResult.evidenceId;
					if (evidenceResult.syncedWithServer) {
						serverEvidenceId = evidenceResult.evidenceId;
					}
				}
			} catch (evidenceErr) {
				evidenceError = evidenceErr.message;
				console.error(
					"[Emergency Dispatch] Failed to process audio via evidenceService:",
					evidenceErr,
				);
			}
		}

		const endTime = new Date().toISOString();

		// 2. Update local incident status and link evidence
		let incident = null;
		if (incidentId) {
			incident = await db.getFirstAsync(
				`SELECT trigger_type, start_time, tracking_token FROM Local_Incidents WHERE incident_id = ?`,
				[incidentId],
			);
			if (!incident) {
				throw new Error("The local emergency incident could not be found.");
			}
			await updateIncidentOnCancel(db, incidentId, finalStatus, evidenceId);
		}

		// 3. Push final status and evidence linkage online
		const updatePayload = {
			incident_id: incidentId,
			user_id: userId,
			trigger_type: incident?.trigger_type || "STANDARD_PANIC",
			start_time: incident?.start_time || endTime,
			status: finalStatus,
			evidence_id: serverEvidenceId,
			tracking_token: incident?.tracking_token || null,
			end_time: endTime,
		};

		const syncResult = await postIncidentOnline(db, updatePayload);

		return {
			success: true,
			evidenceId,
			evidenceSyncedWithServer: !!serverEvidenceId,
			incidentSyncedWithServer: syncResult?.success === true,
			warning:
				evidenceError
					? `Audio evidence could not be saved: ${evidenceError}`
					: evidenceId && !serverEvidenceId
						? "Evidence is saved locally, but could not be linked on the server because its evidence record was not synced."
						: !syncResult?.success
							? "Incident updates are saved locally but could not be synced to the server."
							: null,
		};
	} catch (error) {
		console.error(
			"[Emergency Dispatch] Failed to finalize emergency on cancel:",
			error,
		);
		return { success: false, error: error.message };
	}
};
