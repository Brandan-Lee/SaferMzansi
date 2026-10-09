import "react-native-get-random-values";

import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initDatabase } from "@database/init";
import { AuthProvider } from "@context/AuthContext";
import { NetStatusProvider } from "@utils/network/netStatus";
import AppNavigator from "@navigation/AppNavigator";

const DATABASE_NAME = "safer_mzansi.db";

export default function App() {
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
