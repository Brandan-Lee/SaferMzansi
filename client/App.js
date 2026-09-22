import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";

import { initDatabase } from "./back_end/database/init";

// Import all the screens you want to test
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import ForgotPasswordSuccessScreen from "./src/screens/auth/ForgotPasswordSuccessScreen";
import OTPScreen from "./src/screens/auth/OTPScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegistrationScreen from "./src/screens/auth/RegistrationScreen";

//Retrieve environment variables
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/health`;
const DATABASE_NAME = process.env.EXPO_PUBLIC_DATABASE_NAME;

export default function App() {
	const [status, setStatus] = useState("Connecting to backend...");

	//Connect to the backend Node.js server
	useEffect(() => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

		fetch(API_URL, { signal: controller.signal })
			.then(async (res) => {
				clearTimeout(timeoutId);
				const text = await res.text();
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return JSON.parse(text);
			})
			.then((data) => setStatus(data.message))
			.catch((err) => {
				clearTimeout(timeoutId);
				console.error("Fetch error details:", err);
				if (err.name === "AbortError") {
					setStatus("Connection timed out (Server unreachable)");
				} else {
					setStatus(`Connection failed: ${err.message}`);
				}
			});

		return () => clearTimeout(timeoutId);
	}, []);

	return (
		<SQLiteProvider
			databaseName={DATABASE_NAME}
			onInit={initDatabase}
			useNewConnection={false}
		>
			<View style={styles.container}>
				{/* Display backend connection status at the top */}
				<Text style={styles.statusText}>{status}</Text>

				{/* Render the registration screen as the main content */}
				<View style={styles.screenContainer}>
					{/* Just change this to the screen you want to test, for example <LoginScreen /> or <OTPScreen /> */}
					<RegistrationScreen />
					<ForgotPasswordScreen />
					<ForgotPasswordSuccessScreen />
					<OTPScreen />
					<LoginScreen />
				</View>

				<StatusBar style="auto" />
			</View>
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
