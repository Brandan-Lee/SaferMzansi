import {
	saveDecoyPin,
	saveEmergencyPin,
	verifyPins,
} from "@utils/storage/secureStore";

export const addDecoyConfiguration = async (userId, decoyData) => {
	const { decoyPin, emergencyPin } = decoyData;

	if (!userId) {
		throw new Error("User session is required to add a decoy configraation");
	}

	//Validation
	if (!decoyPin || decoyPin.length < 4) {
		throw new Error(
			"Invalid Decoy PIN",
			"Please enter a Decoy PIN that is atleast 4 digits",
		);
	}

	if (!emergencyPin || emergencyPin.length < 4) {
		throw new Error(
			"Invalid trigger PIN",
			"Please enter a trigger PIN that is atleast 4 digits",
		);
	}

	if (decoyPin === emergencyPin) {
		throw new Error("Decoy PIN and Emergency Trigger PIN cannot be the same");
	}

	try {
		const decoyResult = await saveDecoyPin(decoyPin);

		if (!decoyResult.success) {
			throw new Error("Failed to save Decoy PIN");
		}

		const emergencyResult = await saveEmergencyPin(emergencyPin);

		if (!emergencyResult.success) {
			throw new Error("Failed to save Trigger PIN");
		}

		return {
			success: true,
		};
	} catch (error) {
		console.error(
			"Failed to save decoy configuration to secure storage:",
			error,
		);
		throw new Error(
			error.message || "Failed to save PIN configuration securely",
		);
	}
};

export const verifyDecoyAttempt = async (enteredPin) => {
	if (!enteredPin || enteredPin.trim() === "") {
		return null;
	}

	try {
		const matchType = await verifyPins(enteredPin.trim());
		return matchType;
	} catch (error) {
		console.error("Error during PIN verification service", error);
		return null;
	}
};

export const updateDecoyConfiguration = async (userId, decoyData) => {
	const { decoyPin, emergencyPin } = decoyData;

	if (!userId) {
		throw new Error("User session is required to add a decoy configraation");
	}

	//Validation
	if (!decoyPin || decoyPin.length < 4) {
		throw new Error(
			"Invalid Decoy PIN",
			"Please enter a Decoy PIN that is atleast 4 digits",
		);
	}

	if (!emergencyPin || emergencyPin.length < 4) {
		throw new Error(
			"Invalid trigger PIN",
			"Please enter a trigger PIN that is atleast 4 digits",
		);
	}

	if (decoyPin === emergencyPin) {
		throw new Error("Decoy PIN and Emergency Trigger PIN cannot be the same");
	}

	try {
		const decoyResult = await saveDecoyPin(decoyPin);
		if (!decoyResult.success) {
			throw new Error("Failed to update Decoy PIN.");
		}

		const emergencyResult = await saveEmergencyPin(emergencyPin);
		if (!emergencyResult.success) {
			throw new Error("Failed to update Trigger PIN.");
		}

		return { success: true };
	} catch (error) {
		console.error(
			"Failed to update decoy configuration in secure storage:",
			error,
		);
		throw new Error(
			error.message || "Failed to update PIN configuration securely.",
		);
	}
};
