import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const NavigationBar = ({ activeTab = "Home", navigation }) => {
	const insets = useSafeAreaInsets();

	const tabs = [
		{ name: "Home", route: "HomeScreen", icon: "house-user" },
		{
			name: "Contacts",
			route: "EmergencyContactsScreen",
			icon: "address-book",
		},
		{ name: "Vault", route: "EvidenceVaultScreen", icon: "vault" },
		{
			name: "Support Hub",
			route: "SupportHubScreen",
			icon: "hand-holding-heart",
		},
		{ name: "Settings", route: "SettingsScreen", icon: "gear" },
	];

	return (
		<View
			style={[
				styles.tabContainer,
				{ paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
			]}
		>
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
							<View style={styles.tabContent}>
								<FontAwesome6
									name={tab.icon}
									size={20}
									color={isActive ? "#6B21A8" : "#9CA3AF"}
								/>
								<Text
									style={[styles.tabLabel, isActive && styles.tabLabelActive]}
									numberOfLines={1}
								>
									{tab.name}
								</Text>
							</View>
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
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#F3E8FF",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 10,
	},
	tabBar: {
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
	},
	tabItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
	},
	tabContent: {
		alignItems: "center",
		justifyContent: "center",
	},
	tabLabel: {
		fontSize: 10,
		color: "#9CA3AF",
		fontWeight: "500",
		marginTop: 3,
		textAlign: "center",
	},
	tabLabelActive: {
		color: "#6B21A8",
		fontWeight: "700",
	},
});
