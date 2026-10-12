import "react-native-get-random-values";

import React, { useEffect } from "react";
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

const DATABASE_NAME = "safer_mzansi.db";
export const BACKGROUND_SHAKE_TASK = "BACKGROUND_SHAKE_TASK";

TaskManager.defineTask(BACKGROUND_SHAKE_TASK, async ({ data, error }) => {
	if (error) {
		console.error("SaferMzansi Background Shake Task Exception:", error);
		return;
	}
	if (data) {
		console.log(
			"Background Task Triggered:",
			data?.locations?.[0]?.coords?.latitude,
			data?.locations?.[0]?.coords?.longitude,
		);
	}
});
export default function App() {
	const { getLocation, loading: locationLoading } = useLocation();

	//Method to ask permissions or background configurations manually if needed
	const runBackgroundLocationTracking = async () => {
		try {
			const { status: fgStatus } =
				await Location.requestForegroundPermissionsAsync();
			const { status: bgStatus } =
				await Location.requestBackgroundPermissionsAsync();

			if (fgStatus !== "granted" || bgStatus !== "granted") {
				Alert.alert(
					"Permissions Missing",
					"Please accept both foreground and background tracking settings.",
				);
				return;
			}

			// Actually start the background task
			await Location.startLocationUpdatesAsync(BACKGROUND_SHAKE_TASK, {
				accuracy: Location.Accuracy.Balanced, //low , balanced, high
				timeInterval: 5000, //ms
				distanceInterval: 1, //Meter
			});

			console.log("Background tracking task started successfully.");
		} catch (error) {
			console.log("Initialization Error", error.message);
		}
	};

	const handleEmergencyShake = async () => {
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
	};

	useShake(handleEmergencyShake);

	useEffect(() => {
		runBackgroundLocationTracking();
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
