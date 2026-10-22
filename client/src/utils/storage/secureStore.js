import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "@constants/storageKeys";

export const saveEmergencyUserId = async (userId) => {
	if (!userId) return;
	await SecureStore.setItemAsync(STORAGE_KEYS.EMERGENCY_USER_ID, userId);
};

export const getEmergencyUserId = async () => {
	return SecureStore.getItemAsync(STORAGE_KEYS.EMERGENCY_USER_ID);
};

export const saveDecoyPin = async (pin) => {
	try {
		await SecureStore.setItemAsync(STORAGE_KEYS.DECOY_PIN, pin);
		return {
			success: true,
		};
	} catch (error) {
		console.error("Error saving decoy PIN:", error);
		return {
			success: false,
			error,
		};
	}
};

export const saveEmergencyPin = async (pin) => {
	try {
		await SecureStore.setItemAsync(STORAGE_KEYS.EMERGENCY_PIN, pin);
		return {
			success: true,
		};
	} catch (error) {
		console.error("Error saving emergency PIN", error);
		return {
			success: false,
			error,
		};
	}
};

export const verifyPins = async (enteredPin) => {
	const storedDecoy = await SecureStore.getItemAsync(STORAGE_KEYS.DECOY_PIN);
	const storedEmergency = await SecureStore.getItemAsync(
		STORAGE_KEYS.EMERGENCY_PIN,
	);

	if (storedDecoy && enteredPin === storedDecoy) {
		return "decoy";
	}

	if (storedEmergency && enteredPin === storedEmergency) {
		return "emergency";
	}

	return null;
};

export const getStoredPins = async () => {
	const decoyPin = await SecureStore.getItemAsync(STORAGE_KEYS.DECOY_PIN);
	const emergencyPin = await SecureStore.getItemAsync(
		STORAGE_KEYS.EMERGENCY_PIN,
	);
	return { decoyPin, emergencyPin };
};

export const saveEmergencyTimer = async (timerSeconds) => {
	try {
		await SecureStore.setItemAsync(
			STORAGE_KEYS.EMERGENCY_TIMER,
			timerSeconds.toString(),
		);
		return {
			success: true,
		};
	} catch (error) {
		console.error("Error saving emergency timer:", error);
		return {
			success: false,
			error,
		};
	}
};

export const getEmergencyTimer = async () => {
	const timer = await SecureStore.getItemAsync(STORAGE_KEYS.EMERGENCY_TIMER);
	return timer !== null ? timer : "5";
};
