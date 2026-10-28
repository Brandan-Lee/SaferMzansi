import React, { useEffect, useState, useRef } from "react";
import {
	StyleSheet,
	Text,
	TouchableOpacity,
	ScrollView,
	Animated,
	Alert,
	Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { AudioModule } from "expo-audio";
import MainLayout from "@components/layouts/MainLayout";
import { useAuth } from "@context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useModal } from "@context/ModalContext";
import SettingsRow from "@components/settings/SettingsRow";
import { STORAGE_KEYS } from "@constants/storageKeys";
import {
	startBackgroundLocationTracking,
	stopBackgroundLocationTracking,
} from "@services/main/backgroundLocationService";

const SettingsScreen = ({ navigation, route }) => {
	const [shareLocation, setShareLocation] = useState(false);
	const [autoRecord, setAutoRecord] = useState(false);
	const [gestureTrigger, setGestureTrigger] = useState(false);
	const { logOut } = useAuth();
	const [highlightedKey, setHighlightedKey] = useState(null);
	const [banner, setBanner] = useState(null);

	const { openModal } = useModal();

	const highlightAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (route.params?.highlight) {
			setHighlightedKey(route.params.highlight);

			Animated.timing(highlightAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: false,
			}).start();

			const timer = setTimeout(() => {
				Animated.timing(highlightAnim, {
					toValue: 0,
					duration: 700,
					useNativeDriver: false,
				}).start(() => {
					setHighlightedKey(null);
				});
			}, 1800);

			return () => clearTimeout(timer);
		}
	}, [route.params]);

	const animatedBgColor = highlightAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["rgba(245, 243, 255, 0)", "rgba(237, 233, 254, 1)"],
	});

	useEffect(() => {
		const loadSettings = async () => {
			try {
				//For location Sharing
				const savedShare = await AsyncStorage.getItem(
					STORAGE_KEYS.SHARE_LOCATION,
				);

				if (savedShare !== null) {
					setShareLocation(savedShare === "true");
				}

				//For auto-recording
				const savedRecord = await AsyncStorage.getItem(
					STORAGE_KEYS.AUTO_RECORDING,
				);

				if (savedRecord !== null) {
					setAutoRecord(savedRecord === "true");
				}

				// Restore the saved gesture preference.
				const gesture = await AsyncStorage.getItem(
					STORAGE_KEYS.EMERGENCY_GESTURE,
				);

				if (gesture !== null) {
					setGestureTrigger(gesture === "true");
				}
			} catch (error) {
				setBanner({
					message: "Settings could not be loaded. Please reopen this screen.",
					type: "error",
				});
				console.error("Failed to load settings:", error);
			}
		};

		loadSettings();
	}, []);

	const toggleSetting = async (key, currentValue, stateSetter) => {
		const newValue = !currentValue;
		setBanner(null);
		try {
			if (key === STORAGE_KEYS.SHARE_LOCATION && newValue) {
				const foreground = await Location.requestForegroundPermissionsAsync();
				if (foreground.status !== "granted") {
					throw new Error(
						"Location permission is needed to include your location in emergency alerts.",
					);
				}

				const background = await Location.requestBackgroundPermissionsAsync();
				if (background.status !== "granted") {
					throw new Error(
						"Background location permission is needed for emergency alerts while the app is closed.",
					);
				}

				const trackingStarted = await startBackgroundLocationTracking();
				if (!trackingStarted) {
					throw new Error("Background location permission was not granted.");
				}
			} else if (key === STORAGE_KEYS.SHARE_LOCATION && !newValue) {
				// Disable location use first so a background task will stop even if
				// stopping the native task itself fails.
				await AsyncStorage.setItem(key, "false");
				stateSetter(false);
				await stopBackgroundLocationTracking();
				return;
			} else if (key === STORAGE_KEYS.AUTO_RECORDING && newValue) {
				const permission = await AudioModule.requestRecordingPermissionsAsync();
				if (permission.status !== "granted") {
					throw new Error(
						"Microphone permission is needed to record audio during an emergency.",
					);
				}
			}

			await AsyncStorage.setItem(key, String(newValue));
			stateSetter(newValue);
		} catch (error) {
			setBanner({ message: error.message, type: "error" });
			console.error(`Failed to save setting for key: ${key}`, error);
		}
	};

	const handleLogout = async () => {
		setBanner({
			message: "Logging out...",
			type: "warning",
		});
		await logOut("LoginScreen", {
			banner: {
				message: "You have been logged out.",
				type: "success",
			},
		});
	};

	return (
		<MainLayout
			title="Settings"
			onBack={() => navigation.goBack()}
			banner={banner}
			tab="Settings"
			navigation={navigation}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* PROFILE */}
				<SettingsRow
					icon="user"
					title="Profile"
					onPress={() => navigation.navigate("ProfileScreen")}
				/>

				<SettingsRow
					icon="clock"
					title="Panic Cancel Configuration"
					onPress={() => navigation.navigate("EmergencyTimerConfigScreen")}
				/>

				<SettingsRow
					icon="trash-2"
					title="Recycling Bin"
					onPress={() => navigation.navigate("RecycleBinScreen")}
				/>

				{/* ALERTS */}
				<Text style={styles.sectionTitle}>Alerts</Text>

				<SettingsRow
					icon="map-pin"
					title="Share Live Location"
					isToggle
					value={shareLocation}
					isHighlighted={highlightedKey === "shareLocation"}
					highlightColor={animatedBgColor}
					onPress={() =>
						toggleSetting(
							STORAGE_KEYS.SHARE_LOCATION,
							shareLocation,
							setShareLocation,
						)
					}
				/>

				<SettingsRow
					icon="mic"
					title="Voice recording on trigger"
					isToggle
					value={autoRecord}
					onPress={() =>
						toggleSetting(
							STORAGE_KEYS.AUTO_RECORDING,
							autoRecord,
							setAutoRecord,
						)
					}
				/>

				<SettingsRow
					icon="smartphone"
					title="Gesture Activation"
					isToggle
					value={gestureTrigger}
					onPress={() =>
						toggleSetting(
							STORAGE_KEYS.EMERGENCY_GESTURE,
							gestureTrigger,
							setGestureTrigger,
						)
					}
				/>

				{/* SECURITY */}
				<Text style={styles.sectionTitle}>Security</Text>

				<SettingsRow
					icon="lock"
					title="Decoy Configuration"
					onPress={() => navigation.navigate("DecoyConfigurationScreen")}
				/>

				{/* ABOUT */}
				<Text style={styles.sectionTitle}>About</Text>

				<SettingsRow
					icon="shield-lock-outline"
					materialIcon
					title="Privacy policy"
					onPress={() => openModal("privacy")}
				/>

				<SettingsRow
					icon="check-circle-outline"
					materialIcon
					title="Terms of Service"
					onPress={() => openModal("terms")}
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
