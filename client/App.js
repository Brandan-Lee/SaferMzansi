import "react-native-get-random-values";

import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Alert } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { initDatabase } from "@database/init";
import { AuthProvider } from "@context/AuthContext";
import { NetStatusProvider } from "@utils/network/netStatus";
import AppNavigator from "@navigation/AppNavigator";
import * as TaskManager from "expo-task-manager";
import { useShake } from "@hooks/useShake";
import { useLocation } from "@hooks/useLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DATABASE_NAME = "safer_mzansi.db";
export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

const KEYS = {
	SHARE_LOCATION: "@setting_share_location",
	GESTURE: "@setting_gesture",
};

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
	if (error) {
		console.error("SaferMzansi Background Location Task Exception:", error);
		return;
	}

	try {
		// Always check persistent storage inside the background thread
		const savedShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);
		const isSharingEnabled = savedShare === "true";

		if (!isSharingEnabled) {
			console.log(
				"Background location received, but sharing is disabled by user setting.",
			);
			// Optionally stop location updates here if user turned it off
			await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
			return;
		}

		if (data) {
			const { locations } = data;
			if (locations && locations.length > 0) {
				const { latitude, longitude } = locations[0].coords;
				console.log("Background Location :", latitude, longitude);
			}
		}
	} catch (err) {
		console.error("Error reading storage inside background task:", err);
	}
});

export default function App() {
	const { getLocation, loading: locationLoading } = useLocation();
	const [shareLiveLocation, setShareLiveLocation] = useState(false);
	const [recording, setRecording] = useState(undefined);

	async function startRecording() {
		try {
			// Dynamically require expo-av to prevent top-level runtime crashes if native module is unlinked
			const { Audio } = require("expo-av");

			const permissionResponse = await Audio.getPermissionsAsync();
			if (permissionResponse?.status !== "granted") {
				console.log("Requesting permission...");
				const status = await Audio.requestPermissionsAsync();

				if (status.status !== "granted") {
					console.log("Permission denied");
					return;
				}
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			});

			console.log("Starting recording...");

			const { recording: newRecording } = await Audio.Recording.createAsync(
				Audio.RecordingOptionsPresets.HIGH_QUALITY,
			);

			setRecording(newRecording);
			console.log("Recording started");
		} catch (error) {
			console.error(
				"Failed to start recording (expo-av native module might be unlinked)",
				error,
			);
		}
	}

	async function stopRecording() {
		if (!recording) return;

		try {
			console.log("Stopping recording...");
			const activeRecording = recording;
			setRecording(undefined);

			await activeRecording.stopAndUnloadAsync();
			const uri = activeRecording.getURI();
			console.log("Recording stopped and stored at:", uri);
			return uri;
		} catch (error) {
			console.error("Failed to stop recording", error);
		}
	}

	// Method to ask permissions and start background location tracking
	const runBackgroundLocationTracking = async () => {
		try {
			const { status: fgStatus } =
				await Location.requestForegroundPermissionsAsync();
			const { status: bgStatus } =
				await Location.requestBackgroundPermissionsAsync();

			if (fgStatus !== "granted" || bgStatus !== "granted") {
				Alert.alert(
					"Permissions Missing",
					"Please accept both foreground and background tracking settings to share your live location.",
				);
				return;
			}

			// Check if task is already running to avoid duplication errors
			const isRegistered = await TaskManager.isTaskRegisteredAsync(
				BACKGROUND_LOCATION_TASK,
			);

			if (!isRegistered) {
				await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
					accuracy: Location.Accuracy.Balanced,
					timeInterval: 5000,
					distanceInterval: 1,
					showsBackgroundLocationIndicator: true, // Required for iOS background tracking visibility
					foregroundService: {
						notificationTitle: "Safer Mzansi Active",
						notificationBody:
							"Live location sharing is running in the background.",
						notificationColor: "#FF0000",
					},
				});
				console.log("Background tracking task started successfully.");
			}
		} catch (error) {
			console.log("Background Tracking Initialization Error:", error.message);
		}
	};

	const handleEmergencyShake = async () => {
		try {
			const savedGesture = await AsyncStorage.getItem(KEYS.GESTURE);
			const isGestureEnabled = savedGesture === "true";

			if (!isGestureEnabled) {
				console.log(
					"Shake detected, but gesture activation is disabled in settings",
				);
				return;
			}

			console.log("Emergency shake triggered!");

			const result = await getLocation();

			if (result.success) {
				console.log(
					"GPS COORDINATES:",
					result.location.latitude,
					result.location.longitude,
				);
			} else {
				console.log("Location capture failed:", result.error);
			}
		} catch (error) {
			console.error("Error reading gesture activation setting:", error);
		}
	};

	useShake(handleEmergencyShake);

	// Load saved setting and initialize background tracking if enabled
	useEffect(() => {
		const initializeSettings = async () => {
			try {
				const savedShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);

				if (savedShare !== null) {
					const isShared = savedShare === "true";
					setShareLiveLocation(isShared);

					if (isShared) {
						runBackgroundLocationTracking();
					}
				}
			} catch (error) {
				console.error("Error reading location sharing preference: ", error);
			}
		};

		initializeSettings();
	}, []);

	return (
		<SafeAreaProvider>
			<SQLiteProvider
				databaseName={DATABASE_NAME}
				onInit={initDatabase}
				useNewConnection={false}
			>
				<NetStatusProvider>
					<AuthProvider>
						<View style={styles.container}>
							<AppNavigator />
							<StatusBar style="auto" />
						</View>
					</AuthProvider>
				</NetStatusProvider>
			</SQLiteProvider>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
});
