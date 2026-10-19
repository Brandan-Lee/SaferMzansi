import {
	getEmergencyTimer,
	saveEmergencyTimer,
} from "@utils/storage/secureStore";

export const updateEmergencyTimerConfig = async (
	userId,
	timerSeconds,
) => {
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
