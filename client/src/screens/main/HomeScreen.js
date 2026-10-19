import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationBar } from "@components/common/NavigationBar";
import { ProtectionRadar } from "@components/home/ProtectionRadar";
import { SafetyToolCard } from "@components/home/SafetyToolCard";
import { decryptData } from "@utils/securityAndValidation/securityUtil";
import { useAuth } from "@context/AuthContext";
import AuthLayout from "@components/layouts/AuthLayout";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { getLocalContactTotal } from "@database/repositories/contactRepository";
import { getEvidenceTotal } from "@services/evidence/evidenceService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	Shield,
	ShieldOff,
	MapPin,
	MapPinOff,
	Users,
	Lock,
	AlertTriangle,
} from "lucide-react-native";

const KEYS = {
	SHARE_LOCATION: "@setting_share_location",
	DECOY_LAUNCH_KEY: "@setting_launch_decoy",
};

const INITIAL_QUICK_ACTIONS = [
	{
		id: "decoy",
		title: "Decoy Mode",
		subtitle: "Decoy Mode is active",
		icon: Shield,
		color: "#8B5CF6",
		bg: "#F5F3FF",
		route: "DecoyConfigurationScreen",
	},
	{
		id: "location",
		title: "Live Location",
		subtitle: "Checking permission...",
		icon: MapPin,
		color: "#10B981",
		bg: "#ECFDF5",
		route: "LocationScreen",
	},
	{
		id: "contacts",
		title: "Emergency Contacts",
		subtitle: "Loading contacts...",
		icon: Users,
		color: "#3B82F6",
		bg: "#EFF6FF",
		route: "EmergencyContactsScreen",
	},
	{
		id: "vault",
		title: "Secure Vault",
		subtitle: "Loading vault evidence...",
		icon: Lock,
		color: "#F59E0B",
		bg: "#FFFBEB",
		route: "EvidenceVaultScreen",
	},
];

const INITIAL_RADIAL_ACTIONS = [
	{
		id: "decoy",
		icon: Shield,
		route: "DecoyConfigurationScreen",
		angle: 225,
		color: "#FFFFFF",
		bg: "#7E22CE",
	},
	{
		id: "location",
		icon: MapPin,
		route: "SettingsScreen",
		params: { highlight: "shareLocation" },
		angle: 315,
		color: "#FFFFFF",
		bg: "#7E22CE",
	},
	{
		id: "alert",
		icon: AlertTriangle,
		route: "SOSScreen",
		angle: 135,
		color: "#FFFFFF",
		bg: "#7E22CE",
	},
	{
		id: "contacts",
		icon: Users,
		route: "EmergencyContactsScreen",
		angle: 45,
		color: "#FFFFFF",
		bg: "#7E22CE",
	},
];

const HomeScreen = ({ navigation }) => {
	const { user } = useAuth();
	const db = useSQLiteContext();
	const [contactCount, setContactCount] = useState(0);
	const [evidenceCount, setEvidenceCount] = useState(0);
	const [shareLiveLocation, setShareLiveLocation] = useState(false);
	const [decoyActivated, setDecoyActivated] = useState(false);

	const resolveDisplayName = (name) => {
		if (!name) return "User";
		try {
			return decryptData(name);
		} catch (error) {
			return name;
		}
	};

	const displayName = resolveDisplayName(user?.userName);

	// Fetch data whenever the screen gains focus
	useFocusEffect(
		useCallback(() => {
			let isMounted = true;

			const fetchHomeCounts = async () => {
				const userId = user?.userId;
				if (!userId || !db) return;

				try {
					const [contactsTotal, evidenceTotal] = await Promise.all([
						getLocalContactTotal(db, userId),
						getEvidenceTotal(db, userId),
					]);

					if (isMounted) {
						setContactCount(contactsTotal);
						setEvidenceCount(evidenceTotal);
					}
				} catch (error) {
					console.error("[Home] Failed to fetch totals:", error);
				}
			};

			const checkPermissions = async () => {
				try {
					//Location
					const saveShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);

					if (saveShare !== null) {
						setShareLiveLocation(saveShare === "true");
					}

					//Decoy
					const saveDecoy = await AsyncStorage.getItem(KEYS.DECOY_LAUNCH_KEY);

					if (saveDecoy !== null) {
						setDecoyActivated(saveDecoy === "true");
					}
				} catch (error) {
					console.error("Error updating the home screen: ", error);
				}
			};

			//Methods to invoke
			fetchHomeCounts();
			checkPermissions();

			return () => {
				isMounted = false;
			};
		}, [db, user]),
	);

	const quickActions = INITIAL_QUICK_ACTIONS.map((item) => {
		if (item.id === "contacts") {
			return {
				...item,
				subtitle:
					contactCount === 0
						? "No emergency contacts saved"
						: `${contactCount} saved emergency contact${contactCount === 1 ? "" : "s"}`,
			};
		}

		if (item.id === "vault") {
			return {
				...item,
				subtitle:
					evidenceCount === 0
						? "No incident evidence stored yet"
						: `${evidenceCount} encrypted file${evidenceCount === 1 ? "" : "s"} in vault`,
			};
		}

		if (item.id === "location") {
			return {
				...item,
				subtitle:
					shareLiveLocation === false
						? "You are not sharing your live location"
						: "You are sharing your live location",
				icon: shareLiveLocation === false ? MapPinOff : MapPin,
				color: shareLiveLocation === false ? "#c01414" : "#10B981",
				bg: shareLiveLocation === false ? "#ffe7e7" : "#ECFDF5",
			};
		}

		if (item.id === "decoy") {
			return {
				...item,
				subtitle:
					decoyActivated === false
						? "You have deactivated the decoy interface"
						: "Decoy interface activated",
				icon: decoyActivated === false ? ShieldOff : Shield,
				color: decoyActivated === false ? "#c01414" : "#8B5CF6",
				bg: decoyActivated === false ? "#ffe7e7" : "#F5F3FF",
			};
		}

		return item;
	});

	const radialActions = useMemo(() => {
		return INITIAL_RADIAL_ACTIONS.map((action) => {
			if (action.id === "location") {
				return {
					...action,
					icon: shareLiveLocation === false ? MapPinOff : MapPin,
				};
			}
			if (action.id === "decoy") {
				return {
					...action,
					icon: decoyActivated === false ? ShieldOff : Shield,
				};
			}
			return action;
		});
	}, [shareLiveLocation, decoyActivated]);

	return (
		<View style={styles.screenContainer}>
			<AuthLayout title={`Welcome back ${displayName}`}>
				<View style={styles.content}>
					<ProtectionRadar actions={radialActions} navigation={navigation} />

					<View style={styles.toolsSection}>
						<Text style={styles.sectionTitle}>Safety Tools</Text>
						<View style={styles.grid}>
							{quickActions.map((item) => (
								<SafetyToolCard
									key={item.id}
									item={item}
									onPress={() => {
										if (item.id === "location") {
											navigation.navigate("SettingsScreen", {
												highlight: "shareLocation",
											});
										} else if (item.route) {
											navigation.navigate(item.route);
										}
									}}
								/>
							))}
						</View>
					</View>
				</View>
			</AuthLayout>

			<View style={styles.navWrapper}>
				<NavigationBar activeTab="Home" navigation={navigation} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: { flex: 1, position: "relative" },
	content: { paddingHorizontal: 20, paddingBottom: 10, alignItems: "center" },
	toolsSection: { width: "100%" },
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
	navWrapper: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		alignItems: "center",
		zIndex: 99,
	},
});

export default HomeScreen;
