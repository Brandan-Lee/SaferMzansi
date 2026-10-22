import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { BACKGROUND_LOCATION_TASK } from "@constants/locationConstants";
import { STORAGE_KEYS } from "@constants/storageKeys";

// Expo requires background tasks to be registered when the app module loads.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ error }) => {
	if (error) {
		console.error("SaferMzansi Background Location Task Exception:", error);
		return;
	}

	try {
		const sharingEnabled =
			(await AsyncStorage.getItem(STORAGE_KEYS.SHARE_LOCATION)) === "true";
		if (!sharingEnabled) {
			await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
		}
	} catch (taskError) {
		console.error("Could not check background location settings:", taskError);
	}
});

export const startBackgroundLocationTracking = async () => {
	const foreground = await Location.getForegroundPermissionsAsync();
	const background = await Location.getBackgroundPermissionsAsync();

	if (foreground.status !== "granted" || background.status !== "granted") {
		return false;
	}

	const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(
		BACKGROUND_LOCATION_TASK,
	);
	if (!alreadyRegistered) {
		await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
			accuracy: Location.Accuracy.Balanced,
			timeInterval: 5000,
			distanceInterval: 1,
			showsBackgroundLocationIndicator: true,
			foregroundService: {
				notificationTitle: "Safer Mzansi Active",
				notificationBody: "Location access is active for emergency alerts.",
				notificationColor: "#FF0000",
			},
		});
	}

	return true;
};

export const stopBackgroundLocationTracking = async () => {
	const isRegistered = await TaskManager.isTaskRegisteredAsync(
		BACKGROUND_LOCATION_TASK,
	);
	if (isRegistered) {
		await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
	}
};
