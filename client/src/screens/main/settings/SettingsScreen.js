import React, { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	ScrollView,
	Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import { useAuth } from "@context/AuthContext";

const SettingsScreen = ({ navigation }) => {
	const [shareLocation, setShareLocation] = useState(false);
	const [autoRecord, setAutoRecord] = useState(false);
	const [smsEmailTrigger, setSmsEmailTrigger] = useState(false);
	const [cloudBackup, setCloudBackup] = useState(false);
	const { logOut } = useAuth();

	const showTemporaryAlert = (title) => {
		Alert.alert(title, "This function will be connected later.");
	};

	const SettingRow = ({
		icon,
		title,
		danger = false,
		onPress,
		materialIcon = false,
	}) => {
		return (
			<TouchableOpacity
				style={styles.row}
				onPress={onPress}
				activeOpacity={0.7}
			>
				<View style={styles.rowLeft}>
					{materialIcon ? (
						<MaterialCommunityIcons
							name={icon}
							size={26}
							color={danger ? "#DC2626" : "#2D1638"}
						/>
					) : (
						<Feather
							name={icon}
							size={25}
							color={danger ? "#DC2626" : "#2D1638"}
						/>
					)}

					<Text style={[styles.rowText, danger && styles.dangerText]}>
						{title}
					</Text>
				</View>

				<Feather
					name="chevron-right"
					size={27}
					color={danger ? "#DC2626" : "#2D1638"}
				/>
			</TouchableOpacity>
		);
	};

	const ToggleRow = ({ icon, title, value, onPress, materialIcon = false }) => {
		return (
			<TouchableOpacity
				style={styles.row}
				onPress={onPress}
				activeOpacity={0.7}
			>
				<View style={styles.rowLeft}>
					{materialIcon ? (
						<MaterialCommunityIcons name={icon} size={26} color="#2D1638" />
					) : (
						<Feather name={icon} size={25} color="#2D1638" />
					)}

					<Text style={styles.rowText}>{title}</Text>
				</View>

				<View style={[styles.checkbox, value && styles.checkboxActive]}>
					{value && <Feather name="check" size={17} color="#FFFFFF" />}
				</View>
			</TouchableOpacity>
		);
	};

	const handleLogout = async () => {
		await logOut("LoginScreen");
	};

	return (
		<MainLayout
			title="Settings"
			onBack={() => navigation.replace("HomeScreen")}
			tab="Settings"
			navigation={navigation}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* PROFILE */}
				<SettingRow
					icon="user"
					title="Profile"
					onPress={() => navigation.replace("ProfileScreen")}
				/>

				<SettingRow
					icon="clock"
					title="Panic cancel window"
					onPress={() => showTemporaryAlert("Panic cancel window")}
				/>

				{/* ALERTS */}
				<Text style={styles.sectionTitle}>Alerts</Text>

				<ToggleRow
					icon="map-pin"
					title="Share live location"
					value={shareLocation}
					onPress={() => setShareLocation((prev) => !prev)}
				/>

				<ToggleRow
					icon="mic"
					title="Auto-record on trigger"
					value={autoRecord}
					onPress={() => setAutoRecord((prev) => !prev)}
				/>

				<ToggleRow
					icon="message-square"
					title="SMS/Email trigger"
					value={smsEmailTrigger}
					onPress={() => setSmsEmailTrigger((prev) => !prev)}
				/>

				{/* SECURITY */}
				<Text style={styles.sectionTitle}>Security</Text>

				<SettingRow
					icon="lock"
					title="Decoy activation code"
					onPress={() => showTemporaryAlert("Decoy activation code")}
				/>

				<ToggleRow
					icon="cloud-lock-outline"
					title="Encrypted cloud backup"
					materialIcon
					value={cloudBackup}
					onPress={() => setCloudBackup((prev) => !prev)}
				/>

				<SettingRow icon="log-out" title="Logout" onPress={handleLogout} />

				<SettingRow
					icon="trash-2"
					title="Wipe app data"
					danger
					onPress={() =>
						Alert.alert(
							"Wipe app data",
							"This destructive action will be connected later.",
						)
					}
				/>

				{/* ABOUT */}
				<Text style={styles.sectionTitle}>About</Text>

				<SettingRow
					icon="shield-lock-outline"
					materialIcon
					title="Privacy policy"
					onPress={() => showTemporaryAlert("Privacy policy")}
				/>
			</ScrollView>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 12,
	},

	backButton: {
		width: 36,
		height: 40,
		justifyContent: "center",
		alignItems: "flex-start",
	},

	headerTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#6B21A8",
	},

	scrollView: {
		flex: 1,
	},

	content: {
		paddingHorizontal: 22,
		paddingBottom: 30,
	},

	sectionTitle: {
		fontSize: 15,
		fontWeight: "bold",
		color: "#111827",
		marginTop: 22,
		marginBottom: 5,
	},

	row: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: "#D8C7E8",
	},

	rowLeft: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},

	rowText: {
		fontSize: 17,
		fontWeight: "500",
		color: "#111827",
		marginLeft: 15,
	},

	dangerText: {
		color: "#DC2626",
	},

	checkbox: {
		width: 23,
		height: 23,
		borderWidth: 1.5,
		borderColor: "#374151",
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
	},

	checkboxActive: {
		backgroundColor: "#6B21A8",
		borderColor: "#6B21A8",
	},
});

export default SettingsScreen;
