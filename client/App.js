import "react-native-get-random-values";

import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDatabase } from "@database/init";
import { AuthProvider } from "@context/AuthContext";
import { NetStatusProvider } from "@utils/network/netStatus";
import AppNavigator from "@navigation/AppNavigator";
import { useShake } from "@hooks/useShake";
import { useLocation } from "@hooks/useLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNavigationContainerRef } from "@react-navigation/native";
import { ModalProvider } from "@context/ModalContext";
import { STORAGE_KEYS } from "@constants/storageKeys";
import { startBackgroundLocationTracking } from "@services/main/backgroundLocationService";

const DATABASE_NAME = "safer_mzansi.db";

// Create a global navigation reference
export const navigationRef = createNavigationContainerRef();

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

	const handleEmergencyShake = async () => {
		try {
			const savedGesture = await AsyncStorage.getItem(
				STORAGE_KEYS.EMERGENCY_GESTURE,
			);
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
				const savedShare = await AsyncStorage.getItem(
					STORAGE_KEYS.SHARE_LOCATION,
				);

				if (savedShare === "true") {
					await startBackgroundLocationTracking();
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