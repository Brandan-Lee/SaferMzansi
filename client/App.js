import "react-native-get-random-values";

import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
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
import { createNavigationContainerRef } from "@react-navigation/native";
import { ModalProvider } from "@context/ModalContext";
import { BACKGROUND_LOCATION_TASK } from "@constants/locationConstants";

const DATABASE_NAME = "safer_mzansi.db";

const KEYS = {
	SHARE_LOCATION: "@setting_share_location",
	GESTURE: "@setting_gesture",
};

// Create a global navigation reference
export const navigationRef = createNavigationContainerRef();

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ error }) => {
	if (error) {
		console.error("SaferMzansi Background Location Task Exception:", error);
		return;
	}

	try {
		const savedShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);
		const isSharingEnabled = savedShare === "true";

		if (!isSharingEnabled) {
			await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
			return;
		}

		// Background fixes are not sent or stored; SOS dispatch shares a fix only when triggered.
	} catch (err) {
		console.error("Error reading storage inside background task:", err);
	}
});

export default function App() {
	const { getLocation } = useLocation();
	const pendingSOSNavigation = useRef(false);

	const handleNavigationReady = () => {
		if (pendingSOSNavigation.current) {
			pendingSOSNavigation.current = false;
			navigationRef.resetRoot({
				index: 0,
				routes: [{ name: "SOSScreen" }],
			});
		}
	};

	const runBackgroundLocationTracking = async () => {
		try {
			// Settings owns permission prompts; startup only resumes previously granted access.
			const foreground = await Location.getForegroundPermissionsAsync();
			const background = await Location.getBackgroundPermissionsAsync();
			if (
				foreground.status !== "granted" ||
				background.status !== "granted"
			) {
				return;
			}

			const isRegistered = await TaskManager.isTaskRegisteredAsync(
				BACKGROUND_LOCATION_TASK,
			);

			if (!isRegistered) {
				await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
					accuracy: Location.Accuracy.Balanced,
					timeInterval: 5000,
					distanceInterval: 1,
					showsBackgroundLocationIndicator: true,
					foregroundService: {
						notificationTitle: "Safer Mzansi Active",
						notificationBody:
							"Location access is active for emergency alerts.",
						notificationColor: "#FF0000",
					},
				});
			}
		} catch (error) {
			console.error("Could not enable background location access:", error);
		}
	};

	const handleEmergencyShake = async () => {
		try {
			const savedGesture = await AsyncStorage.getItem(KEYS.GESTURE);
			const isGestureEnabled = savedGesture === "true";

			if (!isGestureEnabled) return;

			if (navigationRef.isReady()) {
				navigationRef.resetRoot({
					index: 0,
					routes: [{ name: "SOSScreen" }],
				});
			} else {
				pendingSOSNavigation.current = true;
			}

			const result = await getLocation();

			if (result.success) {
				if (navigationRef.isReady()) {
					navigationRef.setParams({ initialLocation: result.location });
				}
			}
		} catch (error) {
			console.error("Error reading gesture activation setting:", error);
		}
	};

	useShake(handleEmergencyShake);

	useEffect(() => {
		const initializeSettings = async () => {
			try {
				const savedShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);

				if (savedShare === "true") {
					runBackgroundLocationTracking();
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
						<ModalProvider>
							<View style={styles.container}>
								<AppNavigator
									navigationRef={navigationRef}
									onNavigationReady={handleNavigationReady}
								/>
								<StatusBar style="auto" />
							</View>
						</ModalProvider>
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