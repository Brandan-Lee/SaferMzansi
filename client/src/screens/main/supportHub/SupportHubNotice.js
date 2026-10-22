import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import { THEME } from "@constants/supportConstants";

export default function SupportHubNotice({
	navigation,
	icon,
	title,
	message,
	showSettingsButton = false,
}) {
	return (
		<MainLayout
			title="Support Hub"
			onBack={() => navigation.goBack()}
			tab="Support Hub"
			navigation={navigation}
		>
			<View style={styles.container}>
				<Ionicons name={icon} size={64} color={THEME.purple} />
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.message}>{message}</Text>
				{showSettingsButton ? (
					<TouchableOpacity
						style={styles.settingsButton}
						onPress={() => navigation.navigate("SettingsScreen")}
						activeOpacity={0.8}
					>
						<Text style={styles.settingsButtonText}>Go to Settings</Text>
					</TouchableOpacity>
				) : null}
			</View>
		</MainLayout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 30,
		paddingBottom: 50,
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: THEME.title,
		marginTop: 16,
		textAlign: "center",
	},
	message: {
		fontSize: 14,
		color: "#555",
		textAlign: "center",
		marginTop: 10,
		lineHeight: 20,
		marginBottom: 24,
	},
	settingsButton: {
		backgroundColor: THEME.purple,
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
	},
	settingsButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
