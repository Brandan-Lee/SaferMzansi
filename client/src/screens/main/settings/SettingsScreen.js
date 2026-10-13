import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
	SHARE_LOCATION: "@setting_share_location",
	AUTO_RECORD: "@setting_auto_record",
	EMAIL: "@setting_email",
	GESTURE: "@setting_gesture",
};

const SettingsScreen = ({ navigation }) => {
	const [shareLocation, setShareLocation] = useState(false);
	const [autoRecord, setAutoRecord] = useState(false);
	const [EmailTrigger, setEmailTrigger] = useState(false);
	const [GestureTrigger, setGestureTrigger] = useState(false);
	const { logOut } = useAuth();

	useEffect(() => {
		const loadSettings = async () => {
			try {
				//For location Sharing
				const savedShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);

				if (savedShare !== null) {
					setShareLocation(savedShare === "true");
				}

				//For auto-recording
				const savedRecord = await AsyncStorage.getItem(KEYS.AUTO_RECORD);

				if (savedRecord !== null) {
					setAutoRecord(savedRecord === "true");
				}

				//For Emailing with event details
				const savedEmail = await AsyncStorage.getItem(KEYS.EMAIL);

				if (savedEmail !== null) {
					setEmailTrigger(savedEmail === "true");
				}

				//For gesture activation
				const gesture = await AsyncStorage.getItem(KEYS.GESTURE);

				if (gesture !== null) {
					setGestureTrigger(gesture === "true");
				}
			} catch (error) {
				console.log(error);
			}
		};

		loadSettings();
	}, []);

	const toggleSetting = async (key, currentValue, stateSetter) => {
		try {
			const newValue = !currentValue;
			stateSetter(newValue);
			await AsyncStorage.setItem(key, String(newValue));
		} catch (error) {
			console.error(`Failed to save setting for key: ${key}`, error);
		}
	};

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
					title="Panic Cancel Configuration"
					onPress={() => showTemporaryAlert("Panic Cancel Configuration")}
				/>

				{/* ALERTS */}
				<Text style={styles.sectionTitle}>Alerts</Text>

				<ToggleRow
					icon="map-pin"
					title="Share Live Location"
					value={shareLocation}
					onPress={() =>
						toggleSetting(KEYS.SHARE_LOCATION, shareLocation, setShareLocation)
					}
				/>

				<ToggleRow
					icon="mic"
					title="Auto-record on Trigger"
					value={autoRecord}
					onPress={() =>
						toggleSetting(KEYS.AUTO_RECORD, autoRecord, setAutoRecord)
					}
				/>

				<ToggleRow
					icon="message-square"
					title="Email Trigger"
					value={EmailTrigger}
					onPress={() =>
						toggleSetting(KEYS.EMAIL, EmailTrigger, setEmailTrigger)
					}
				/>

				<ToggleRow
					icon="smartphone"
					title="Gesture Activation"
					value={GestureTrigger}
					onPress={() =>
						toggleSetting(KEYS.GESTURE, GestureTrigger, setGestureTrigger)
					}
				/>

				{/* SECURITY */}
				<Text style={styles.sectionTitle}>Security</Text>

				<SettingRow
					icon="lock"
					title="Decoy Configuration"
					onPress={() => navigation.replace("DecoyConfigurationScreen")}
				/>

				{/* ABOUT */}
				<Text style={styles.sectionTitle}>About</Text>

				<SettingRow
					icon="shield-lock-outline"
					materialIcon
					title="Privacy policy"
					onPress={() => showTemporaryAlert("Privacy policy")}
				/>

				<SettingRow
					icon="check-circle-outline"
					materialIcon
					title="Terms of Service"
					onPress={() => showTemporaryAlert("Terms of Service")}
				/>

				{/* LOGOUT BUTTON */}
				<TouchableOpacity
					style={styles.logoutButton}
					activeOpacity={0.8}
					onPress={handleLogout}
				>
					<Feather name="log-out" size={20} color="#DC2626" />
					<Text style={styles.logoutButtonText}>Log Out</Text>
				</TouchableOpacity>
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

	logoutButton: {
		flexDirection: "row",
		justifyContent: "center",
		backgroundColor: "#FEF2F2",
		borderWidth: 1.5,
		borderColor: "#FCA5A5",
		borderRadius: 12,
		paddingVertical: 16,
		marginTop: 30,
		alignItems: "center",
	},

	logoutButtonText: {
		fontSize: 17,
		fontWeight: "600",
		color: "#DC2626",
		marginLeft: 10,
	},
});

export default SettingsScreen;
