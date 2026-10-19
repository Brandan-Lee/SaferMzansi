import * as SecureStore from "expo-secure-store";

const DECOY_PIN_KEY = "decoy_pin";
const EMERGENCY_PIN_KEY = "emergency_pin";
const EMERGENCY_TIMER_KEY = "emergency_countdown_timer";

export const saveDecoyPin = async (pin) => {
	try {
		await SecureStore.setItemAsync(DECOY_PIN_KEY, pin);
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
		await SecureStore.setItemAsync(EMERGENCY_PIN_KEY, pin);
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
	try {
		const storedDecoy = await SecureStore.getItemAsync(DECOY_PIN_KEY);
		const storedEmergency = await SecureStore.getItemAsync(EMERGENCY_PIN_KEY);

		if (storedDecoy && enteredPin === storedDecoy) {
			return "decoy";
		}

		if (storedEmergency && enteredPin === storedEmergency) {
			return "emergency";
		}

		return null;
	} catch (error) {
		console.error("Error verifying PINs:", error);
		return null;
	}
};

export const getStoredPins = async () => {
	try {
		const decoyPin = await SecureStore.getItemAsync(DECOY_PIN_KEY);
		const emergencyPin = await SecureStore.getItemAsync(EMERGENCY_PIN_KEY);
		return {
			decoyPin,
			emergencyPin,
		};
	} catch (error) {
		console.error("Error retrieving stored PINs:", error);
		return {
			decoyPin: null,
			emergencyPin: null,
		};
	}
};

export const saveEmergencyTimer = async (timerSeconds) => {
	try {
		await SecureStore.setItemAsync(
			EMERGENCY_TIMER_KEY,
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
	try {
		const timer = await SecureStore.getItemAsync(EMERGENCY_TIMER_KEY);
		return timer !== null ? timer : "5";
	} catch (error) {
		console.error("Error retrieveing emergency timer:", error);
		return "5";
	}
};
