import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

export const FloatingNavigationBar = ({ activeTab = "Home", navigation }) => {
	const tabs = [
		{ name: "Home", route: "HomeScreen", icon: "house-user" },
		{ name: "Contacts", route: "EmergencyContactScreen", icon: "address-book" },
		{ name: "Vault", route: "VaultScreen", icon: "vault" },
		{ name: "Support Hub", route: "SupportHubSreen", icon: "hand-holding-heart" },
		{ name: "Settings", route: "SettingsScreen", icon: "gear" },
	];

	return (
		<View style={styles.tabContainer}>
			<View style={styles.tabBar}>
				{tabs.map((tab) => {
					const isActive = activeTab === tab.name;
					return (
						<TouchableOpacity
							key={tab.name}
							style={styles.tabItem}
							onPress={() => {
								if (!isActive && navigation) {
									navigation.navigate(tab.route);
								}
							}}
							activeOpacity={0.7}
						>
							<FontAwesome6
								name={tab.icon}
								size={20}
								color={isActive ? "#6B21A8" : "#9CA3AF"}
							/>
							<Text
								style={[
									styles.tabLabel,
									isActive && styles.tabLabelActive,
								]}
							>
								{tab.name}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	tabContainer: {
		position: "absolute",
		bottom: 20,
		left: 20,
		right: 20,
	},
	tabBar: {
		height: 60,
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.08,
		shadowRadius: 16,
		elevation: 8,
		borderWidth: 1,
		borderColor: "#F3E8FF",
	},
	tabItem: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	tabLabel: {
		fontSize: 10,
		color: "#9CA3AF",
		fontWeight: "500",
		marginTop: 2,
	},
	tabLabelActive: {
		color: "#6B21A8",
		fontWeight: "700",
	},
});