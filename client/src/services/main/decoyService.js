import {
	saveDecoyPin,
	saveEmergencyPin,
	verifyPins,
} from "@utils/storage/secureStore";

const saveDecoyConfiguration = async (userId, decoyData, action) => {
	const decoyPin = String(decoyData?.decoyPin ?? "").trim();
	const emergencyPin = String(decoyData?.emergencyPin ?? "").trim();

	if (!userId) {
		throw new Error("User session is required to save decoy settings.");
	}

	if (decoyPin.length < 4) {
		throw new Error("Please enter a decoy PIN with at least 4 digits.");
	}

	if (emergencyPin.length < 4) {
		throw new Error("Please enter an emergency PIN with at least 4 digits.");
	}

	if (decoyPin === emergencyPin) {
		throw new Error("Decoy PIN and Emergency Trigger PIN cannot be the same");
	}

	const decoyResult = await saveDecoyPin(decoyPin);
	if (!decoyResult.success) {
		throw new Error(decoyResult.error?.message || "Failed to save decoy PIN.");
	}

	const emergencyResult = await saveEmergencyPin(emergencyPin);
	if (!emergencyResult.success) {
		console.error(
			`Failed to ${action} decoy configuration to secure storage:`,
			emergencyResult.error,
		);
		throw new Error(
			emergencyResult.error?.message || "Failed to save emergency PIN.",
		);
	}

	return { success: true };
};

export const addDecoyConfiguration = async (userId, decoyData) => {
	return saveDecoyConfiguration(userId, decoyData, "add");
};

export const verifyDecoyAttempt = async (enteredPin) => {
	if (!enteredPin || enteredPin.trim() === "") {
		return null;
	}

	return verifyPins(enteredPin.trim());
};

export const updateDecoyConfiguration = async (userId, decoyData) => {
	return saveDecoyConfiguration(userId, decoyData, "update");
};
