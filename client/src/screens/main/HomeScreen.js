import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
	useMemo,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationBar } from "@components/common/NavigationBar";
import { ProtectionRadar } from "@components/home/ProtectionRadar";
import { SafetyToolCard } from "@components/home/SafetyToolCard";
import { decryptOrKeepValue } from "@utils/securityAndValidation/decryptionUtil";
import { useAuth } from "@context/AuthContext";
import { STORAGE_KEYS } from "@constants/storageKeys";
import AuthLayout from "@components/layouts/AuthLayout";
import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { getLocalContactTotal } from "@database/repositories/contactRepository";
import { getEvidenceTotal } from "@services/main/evidenceService";
import { logAllLocalTables } from "@database/logLocalTable";
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

const HomeScreen = ({ navigation, route }) => {
	const { user } = useAuth();
	const db = useSQLiteContext();
	const [contactCount, setContactCount] = useState(null);
	const [evidenceCount, setEvidenceCount] = useState(null);
	const [shareLiveLocation, setShareLiveLocation] = useState(null);
	const [decoyActivated, setDecoyActivated] = useState(false);
	const isMountedRef = useRef(true);
	const refreshInFlightRef = useRef(null);

	const resolveDisplayName = (name) => {
		if (!name) return "User";
		return decryptOrKeepValue(name, "user", "name") || "User";
	};

	const displayName = resolveDisplayName(user?.userName);
	const userId = route?.params?.userId || user?.userId;

	const refreshHome = useCallback(
		async (refreshAfterCurrent = false) => {
			if (refreshInFlightRef.current) {
				await refreshInFlightRef.current;
				if (!refreshAfterCurrent) return;
			}

			const refresh = (async () => {
				try {
					const [savedShare, savedDecoy] = await AsyncStorage.multiGet([
						STORAGE_KEYS.SHARE_LOCATION,
						STORAGE_KEYS.LAUNCH_DECOY,
					]);
					if (isMountedRef.current) {
						setShareLiveLocation(savedShare[1] === "true");
						setDecoyActivated(savedDecoy[1] === "true");
					}
				} catch (error) {
					console.error("[Home] Failed to load saved preferences:", error);
				}

				if (!db || !userId) {
					if (isMountedRef.current) {
						setContactCount(-1);
						setEvidenceCount(-1);
					}
					return;
				}

				try {
					const [contactsTotal, evidenceTotal] = await Promise.all([
						getLocalContactTotal(db, userId),
						getEvidenceTotal(db, userId),
					]);
					if (isMountedRef.current) {
						setContactCount(contactsTotal);
						setEvidenceCount(evidenceTotal);
					}

					if (__DEV__) await logAllLocalTables(db);
				} catch (error) {
					console.error("[Home] Failed to refresh dashboard data:", error);
					if (isMountedRef.current) {
						setContactCount(-1);
						setEvidenceCount(-1);
					}
				}
			})();

			refreshInFlightRef.current = refresh;
			try {
				await refresh;
			} finally {
				if (refreshInFlightRef.current === refresh) {
					refreshInFlightRef.current = null;
				}
			}
		},
		[db, userId],
	);

	// Run on mount even if navigation does not emit an initial focus event.
	useEffect(() => {
		isMountedRef.current = true;
		refreshHome();
		return () => {
			isMountedRef.current = false;
		};
	}, [refreshHome]);

	// Refresh counts and preferences whenever the user returns to Home.
	useFocusEffect(
		useCallback(() => {
			refreshHome(true);
		}, [refreshHome]),
	);

	const quickActions = INITIAL_QUICK_ACTIONS.map((item) => {
		if (item.id === "contacts") {
			return {
				...item,
				subtitle:
					contactCount === null
						? "Loading emergency contacts..."
						: contactCount < 0
							? "Contacts could not be loaded"
							: contactCount === 0
								? "No emergency contacts saved"
								: `${contactCount} saved emergency contact${contactCount === 1 ? "" : "s"}`,
			};
		}

		if (item.id === "vault") {
			return {
				...item,
				subtitle:
					evidenceCount === null
						? "Loading secure vault..."
						: evidenceCount < 0
							? "Vault could not be loaded"
							: evidenceCount === 0
								? "No incident evidence stored yet"
								: `${evidenceCount} encrypted file${evidenceCount === 1 ? "" : "s"} in vault`,
			};
		}

		if (item.id === "location") {
			return {
				...item,
				subtitle:
					shareLiveLocation === null
						? "Checking location setting..."
						: shareLiveLocation
							? "You are sharing your live location"
							: "You are not sharing your live location",
				icon: shareLiveLocation ? MapPin : MapPinOff,
				color: shareLiveLocation ? "#10B981" : "#c01414",
				bg: shareLiveLocation ? "#ECFDF5" : "#ffe7e7",
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
			<AuthLayout
				title={`Welcome back ${displayName}`}
				showFooter={false}
				safeAreaEdges={["top"]}
				scrollContentStyle={{ paddingBottom: 0 }}
				style={styles.authLayout}
			>
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
	screenContainer: { flex: 1 },
	authLayout: { flex: 1 },
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
		width: "100%",
		alignItems: "center",
	},
});

export default HomeScreen;
