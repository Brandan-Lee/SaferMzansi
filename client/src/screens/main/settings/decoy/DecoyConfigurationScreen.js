import React, { useEffect, useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	ScrollView,
	Switch,
} from "react-native";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStoredPins } from "@utils/securityAndValidation/secureStore";

const DECOY_LAUNCH_KEY = "@setting_launch_decoy";

const DecoyConfigurationScreen = ({ navigation }) => {
	const [launchAsDecoy, setLaunchAsDecoy] = useState(false);
	const [pins, setPins] = useState({ decoyPin: null, emergencyPin: null });
	const [isConfigured, setIsConfigured] = useState(false);
	const [loading, setLoading] = useState(true);
	const [showPins, setShowPins] = useState(false);

	useEffect(() => {
		const loadDecoyData = async () => {
			try {
				const savedToggle = await AsyncStorage.getItem(DECOY_LAUNCH_KEY);
				if (savedToggle !== null) {
					setLaunchAsDecoy(savedToggle === "true");
				}

				const storedPins = await getStoredPins();
				setPins(storedPins || {});
				if (storedPins?.decoyPin || storedPins?.emergencyPin) {
					setIsConfigured(true);
				}
			} catch (error) {
				console.error("Failed to load decoy settings", error);
			} finally {
				setLoading(false);
			}
		};

		const unsubscribe = navigation.addListener("focus", loadDecoyData);
		return unsubscribe;
	}, [navigation]);

	const toggleDecoyLaunch = async (value) => {
		try {
			setLaunchAsDecoy(value);
			await AsyncStorage.setItem(DECOY_LAUNCH_KEY, String(value));
		} catch (error) {
			console.error("Failed to save decoy launch setting", error);
		}
	};

	const maskPin = (pin) => {
		if (!pin) return "Not Set";
		if (showPins) return pin;
		return "•".repeat(pin.length);
	};

	return (
		<MainLayout
			title="Decoy Configuration"
			onBack={() => navigation.goBack()}
			tab="Settings"
			navigation={navigation}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* PURPOSE CARD WITH STRUCTURED, CLEAN DESIGN */}
				<View style={styles.card}>
					<View style={styles.cardHeader}>
						<MaterialCommunityIcons
							name="shield-search"
							size={26}
							color="#6B21A8"
						/>
						<Text style={styles.cardTitle}>Why use a Decoy?</Text>
					</View>

					<View style={styles.descriptionContainer}>
						<View style={styles.descRow}>
							<Feather
								name="shield"
								size={16}
								color="#6B21A8"
								style={styles.descIcon}
							/>
							<Text style={styles.descText}>
								<Text style={styles.descBold}>Discreet Protection: </Text>
								SaferMzansi provides discreet safety features to protect you.
								The decoy calculator hides the presence of the real application
								on your device.
							</Text>
						</View>

						<View style={styles.descRow}>
							<Feather
								name="log-in"
								size={16}
								color="#6B21A8"
								style={styles.descIcon}
							/>
							<Text style={styles.descText}>
								<Text style={styles.descBold}>Decoy PIN Unlock: </Text>
								The decoy PIN unlocks the application's main user interface,
								where you will be redirected to a short splash screen and after
								the login screen.
							</Text>
						</View>

						<View style={styles.descRow}>
							<Feather
								name="alert-circle"
								size={16}
								color="#DC2626"
								style={styles.descIcon}
							/>
							<Text style={styles.descText}>
								<Text style={styles.descBold}>Silent Panic Alert: </Text>
								In addition to the shake gesture, entering your emergency
								trigger PIN directly into the calculator acts as a silent panic
								alert where a user' pre-configured timer is started and the user
								is redirected to the panic cancel window. Once the timer has
								stopped, an automatic emergency alert is sent to your emergency
								contacts.
							</Text>
						</View>

						<View style={styles.descRow}>
							<Feather
								name="play-circle"
								size={16}
								color="#2563EB"
								style={styles.descIcon}
							/>
							<Text style={styles.descText}>
								<Text style={styles.descBold}>Interactive Testing: </Text>
								To test the decoy screen, we have pre-configured the decoy PIN
								as <Text style={styles.codeBadge}>1234</Text> and will redirect
								you back to this screen, and the emergency PIN as{" "}
								<Text style={styles.codeBadgeEmergency}>0000</Text> where we
								will show you how the panic cancel window screen looks like.
							</Text>
						</View>
					</View>
				</View>

				{/* CONFIGURED PINS DISPLAY */}
				<View style={styles.sectionHeaderContainer}>
					<Text style={styles.sectionTitle}>Active PIN Configuration</Text>
					{isConfigured && (
						<TouchableOpacity
							style={styles.toggleVisibilityButton}
							onPress={() => setShowPins(!showPins)}
							activeOpacity={0.7}
						>
							<Feather
								name={showPins ? "eye-off" : "eye"}
								size={16}
								color="#6B21A8"
							/>
							<Text style={styles.toggleVisibilityText}>
								{showPins ? "Hide" : "Reveal"}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				<View style={styles.pinDisplayCard}>
					<View style={styles.pinRow}>
						<View style={styles.pinLabelGroup}>
							<Ionicons name="key-outline" size={18} color="#4B5563" />
							<Text style={styles.pinLabel}>Decoy PIN:</Text>
						</View>
						<Text
							style={[styles.pinValue, !pins.decoyPin && styles.notSetText]}
						>
							{maskPin(pins.decoyPin)}
						</Text>
					</View>

					<View style={[styles.pinRow, styles.noBorder]}>
						<View style={styles.pinLabelGroup}>
							<Ionicons name="warning-outline" size={18} color="#DC2626" />
							<Text style={styles.pinLabel}>Emergency Trigger PIN:</Text>
						</View>
						<Text
							style={[
								styles.pinValue,
								styles.emergencyPinText,
								!pins.emergencyPin && styles.notSetText,
							]}
						>
							{maskPin(pins.emergencyPin)}
						</Text>
					</View>
				</View>

				{/* PREVIEW DECOY BUTTON */}
				<TouchableOpacity
					style={styles.previewButton}
					activeOpacity={0.8}
					onPress={() => navigation.navigate("DecoyScreen", { isTesting: true })}
				>
					<Feather name="smartphone" size={20} color="#FFFFFF" />
					<Text style={styles.previewButtonText}>
						Preview & Test Decoy Calculator
					</Text>
					<Feather name="chevron-right" size={18} color="#D8B4FE" />
				</TouchableOpacity>

				{/* LAUNCH TOGGLE SETTING */}
				<Text style={styles.sectionTitle}>Startup Behavior</Text>
				<View style={styles.settingRow}>
					<View style={styles.settingTextContainer}>
						<Text style={styles.settingTitle}>Launch as Decoy on Startup</Text>
						<Text style={styles.settingSubtitle}>
							Open the calculator interface when the app starts
						</Text>
					</View>
					<Switch
						value={launchAsDecoy}
						onValueChange={toggleDecoyLaunch}
						trackColor={{ false: "#E5E7EB", true: "#C084FC" }}
						thumbColor={launchAsDecoy ? "#6B21A8" : "#9CA3AF"}
					/>
				</View>

				{/* ACTION BUTTONS: ADD / UPDATE */}
				<Text style={styles.sectionTitle}>Management</Text>

				{!isConfigured ? (
					<TouchableOpacity
						style={styles.primaryActionButton}
						activeOpacity={0.85}
						onPress={() => navigation.navigate("DecoyAddScreen")}
					>
						<Feather name="plus-circle" size={18} color="#FFFFFF" />
						<Text style={styles.actionButtonText}>Add Decoy Configuration</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={styles.secondaryActionButton}
						activeOpacity={0.85}
						onPress={() => navigation.navigate("DecoyUpdateScreen")}
					>
						<Feather name="edit-3" size={18} color="#6B21A8" />
						<Text style={styles.secondaryActionText}>
							Update Decoy Configuration
						</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 32,
	},
	card: {
		backgroundColor: "#F3E8FF",
		borderRadius: 16,
		padding: 18,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#E9D5FF",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#6B21A8",
		marginLeft: 10,
	},
	descriptionContainer: {
		marginTop: 4,
	},
	descRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	descIcon: {
		marginTop: 2,
		marginRight: 10,
	},
	descText: {
		flex: 1,
		fontSize: 13.5,
		color: "#4B5563",
		lineHeight: 20,
	},
	descBold: {
		fontWeight: "700",
		color: "#1F2937",
	},
	codeBadge: {
		fontWeight: "700",
		color: "#6B21A8",
		backgroundColor: "#EDE9FE",
		overflow: "hidden",
	},
	codeBadgeEmergency: {
		fontWeight: "700",
		color: "#DC2626",
		backgroundColor: "#FEE2E2",
		overflow: "hidden",
	},
	sectionHeaderContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
		textTransform: "uppercase",
		letterSpacing: 0.6,
		marginTop: 8,
		marginBottom: 8,
	},
	toggleVisibilityButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	toggleVisibilityText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#6B21A8",
		marginLeft: 4,
	},
	pinDisplayCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 4,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	pinRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	noBorder: {
		borderBottomWidth: 0,
	},
	pinLabelGroup: {
		flexDirection: "row",
		alignItems: "center",
	},
	pinLabel: {
		fontSize: 15,
		color: "#1F2937",
		fontWeight: "500",
		marginLeft: 8,
	},
	pinValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "#6B21A8",
		letterSpacing: 1.5,
	},
	emergencyPinText: {
		color: "#DC2626",
	},
	notSetText: {
		fontSize: 13,
		color: "#9CA3AF",
		fontWeight: "500",
		letterSpacing: 0,
	},
	previewButton: {
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: "#581C87",
		borderRadius: 14,
		paddingVertical: 15,
		paddingHorizontal: 16,
		alignItems: "center",
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#6B21A8",
	},
	previewButtonText: {
		flex: 1,
		fontSize: 15,
		fontWeight: "600",
		color: "#FFFFFF",
		marginLeft: 10,
	},
	settingRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginBottom: 16,
	},
	settingTextContainer: {
		flex: 1,
		marginRight: 12,
	},
	settingTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111827",
	},
	settingSubtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 3,
		lineHeight: 16,
	},
	primaryActionButton: {
		flexDirection: "row",
		justifyContent: "center",
		backgroundColor: "#6B21A8",
		borderRadius: 14,
		paddingVertical: 15,
		alignItems: "center",
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#FFFFFF",
		marginLeft: 8,
	},
	secondaryActionButton: {
		flexDirection: "row",
		justifyContent: "center",
		backgroundColor: "#F3E8FF",
		borderRadius: 14,
		paddingVertical: 15,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#E9D5FF",
	},
	secondaryActionText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#6B21A8",
		marginLeft: 8,
	},
});

export default DecoyConfigurationScreen;
