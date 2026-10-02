import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/common/AppHeader";
import { FloatingNavigationBar } from "../../components/common/FloatingNavigationBar";
import { ProtectionRadar } from "../../components/home/ProtectionRadar";
import { SafetyToolCard } from "../../components/home/SafetyToolCard";
import { decryptData } from "../../utils/SecurityUtil";

const QUICK_ACTIONS = [
	{
		id: "decoy",
		title: "Decoy Mode",
		subtitle: "Decoy Mode is active",
		icon: "shield-off",
		color: "#8B5CF6",
		bg: "#F5F3FF",
		route: "DecoyScreen",
	},
	{
		id: "location",
		title: "Live Location",
		subtitle: "You have activated the monitoring of your live location",
		icon: "map-pin",
		color: "#10B981",
		bg: "#ECFDF5",
		route: "LocationScreen",
	},
	{
		id: "contacts",
		title: "Emergency Contacts",
		subtitle: "4 user saved emergency contacts",
		icon: "users",
		color: "#3B82F6",
		bg: "#EFF6FF",
		route: "EmergencyContactScreen",
	},
	{
		id: "vault",
		title: "Secure Vault",
		subtitle: "5 Cases include encrypted evidence",
		icon: "lock",
		color: "#F59E0B",
		bg: "#FFFBEB",
		route: "VaultScreen",
	},
];

const RADIAL_ACTIONS = [
	{ id: "lock", icon: "shield-off", route: "DecoyScreen", angle: 225 },
	{ id: "map", icon: "map-pin", route: "LocationScreen", angle: 315 },
	{ id: "alert", icon: "alert-triangle", route: "SOSScreen", angle: 135 },
	{ id: "user", icon: "users", route: "EmergencyContactScreen", angle: 45 },
];

const HomeScreen = ({ navigation, route }) => {
	const rawName = route?.params?.userName;
	const decryptedName = rawName ? decryptData(rawName) : "User";

	return (
		<SafeAreaView style={styles.container}>
			<AppHeader title={`Welcome Back ${decryptedName}`} />

			<View style={styles.content}>
				{/* Protection Radar Component */}
				<ProtectionRadar actions={RADIAL_ACTIONS} navigation={navigation} />

				{/* Safety Tools Grid */}
				<View style={styles.toolsSection}>
					<Text style={styles.sectionTitle}>Safety Tools</Text>
					<View style={styles.grid}>
						{QUICK_ACTIONS.map((item) => (
							<SafetyToolCard
								key={item.id}
								item={item}
								onPress={() => item.route && navigation.navigate(item.route)}
							/>
						))}
					</View>
				</View>
			</View>

			<FloatingNavigationBar activeTab="Home" navigation={navigation} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F8EEFF",
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingBottom: 90,
		justifyContent: "space-between",
		alignItems: "center",
	},
	toolsSection: {
		width: "100%",
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#581C87",
		marginBottom: 10,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: 10,
		width: "100%",
	},
});

export default HomeScreen;