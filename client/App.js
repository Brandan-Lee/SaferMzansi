import "react-native-get-random-values";

import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { initDatabase } from "./src/database/init";
import { AuthProvider } from "./src/context/AuthContext";

// Import of all screens for the mobile app
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import OTPScreen from "./src/screens/auth/OTPScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegistrationScreen from "./src/screens/auth/RegistrationScreen";
import HomeScreen from "./src/screens/main/HomeScreen";

import { NetStatusProvider } from "./src/utils/NetStatus";

const Stack = createNativeStackNavigator();

//Retrieve environment variables
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/health`;
const DATABASE_NAME = "safer_mzansi.db";

export default function App() {
	const [status, setStatus] = useState("TESTING 123 - NEW BUNDLE");

	// //Connect to the backend Node.js server
	// useEffect(() => {
	// 	const controller = new AbortController();
	// 	const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

	// 	fetch(API_URL, { signal: controller.signal })
	// 		.then(async (res) => {
	// 			clearTimeout(timeoutId);
	// 			const text = await res.text();
	// 			if (!res.ok) throw new Error(`HTTP ${res.status}`);
	// 			return JSON.parse(text);
	// 		})
	// 		.then((data) => setStatus(data.message))
	// 		.catch((err) => {
	// 			clearTimeout(timeoutId);
	// 			console.error("Fetch error details:", err);
	// 			if (err.name === "AbortError") {
	// 				setStatus("Connection timed out (Server unreachable)");
	// 			} else {
	// 				setStatus(`Connection failed: ${err.message}`);
	// 			}
	// 		});

	// 	return () => clearTimeout(timeoutId);
	// }, []);

	return (
		<SQLiteProvider
			databaseName={DATABASE_NAME}
			onInit={initDatabase}
			useNewConnection={false}
		>
			<NetStatusProvider>
				<AuthProvider>
					<View style={styles.container}>
						<NavigationContainer>
							<Stack.Navigator

								initialRouteName="LoginScreen"

								screenOptions={{ headerShown: false }}
							>
								<Stack.Screen
									name="RegistrationScreen"
									component={RegistrationScreen}
								/>
								<Stack.Screen name="OTPScreen" component={OTPScreen} />
								<Stack.Screen name="LoginScreen" component={LoginScreen} />
								<Stack.Screen
									name="ForgotPasswordScreen"
									component={ForgotPasswordScreen}
								/>
								<Stack.Screen name="HomeScreen" component={HomeScreen} />
							</Stack.Navigator>
						</NavigationContainer>
						<StatusBar style="auto" />
					</View>
				</AuthProvider>
			</NetStatusProvider>
		</SQLiteProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		paddingTop: 40,
	},
	statusText: {
		fontSize: 12,
		color: "#555",
		textAlign: "center",
		paddingVertical: 8,
		backgroundColor: "#f0f0f0",
	},
	screenContainer: {
		flex: 1,
	},
});
