import "react-native-get-random-values";

import React, { useEffect, useRef, useState } from "react";
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
import { createNavigationContainerRef } from "@react-navigation/native";

const DATABASE_NAME = "safer_mzansi.db";
export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

const KEYS = {
	SHARE_LOCATION: "@setting_share_location",
	GESTURE: "@setting_gesture",
};

// Create a global navigation reference
export const navigationRef = createNavigationContainerRef();

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
	if (error) {
		console.error("SaferMzansi Background Location Task Exception:", error);
		return;
	}

	try {
		const savedShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);
		const isSharingEnabled = savedShare === "true";

		if (!isSharingEnabled) {
			console.log(
				"Background location received, but sharing is disabled by user setting.",
			);
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
	const pendingSOSNavigation = useRef(false);

	const handleNavigationReady = () => {
		console.log(
			"[SOS debug] Navigation ready; current route:",
			navigationRef.getCurrentRoute()?.name,
		);
		if (pendingSOSNavigation.current) {
			pendingSOSNavigation.current = false;
			console.log("[SOS debug] Processing queued SOS navigation.");
			navigationRef.resetRoot({
				index: 0,
				routes: [{ name: "SOSScreen" }],
			});
		}
	};

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
			if (navigationRef.isReady()) {
				const currentRoute = navigationRef.getCurrentRoute()?.name;
				console.log(
					"[SOS debug] Resetting navigation from",
					currentRoute,
					"to SOSScreen.",
				);
				console.log(
					"[SOS debug] Registered root routes:",
					navigationRef
						.getRootState()
						?.routes?.map((route) => route.name),
				);
				navigationRef.resetRoot({
					index: 0,
					routes: [{ name: "SOSScreen" }],
				});
			} else {
				console.log(
					"[SOS debug] Navigation ref is not ready; queueing SOS navigation.",
				);
				console.warn(
					"[SOS debug] Navigation is not ready; SOS route will run on ready.",
				);
				pendingSOSNavigation.current = true;
			}

			const result = await getLocation();

			if (result.success) {
				console.log("[SOS debug] Location capture succeeded.");
				if (navigationRef.isReady()) {
					navigationRef.setParams({ initialLocation: result.location });
					console.log("[SOS debug] Saved captured coordinates for SOS dispatch.");
				}
			} else {
				console.log("Location capture failed:", result.error);
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
							<AppNavigator
								navigationRef={navigationRef}
								onNavigationReady={handleNavigationReady}
							/>
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
