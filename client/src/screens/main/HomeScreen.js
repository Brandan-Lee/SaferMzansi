import React, { useCallback, useEffect, useState, useMemo } from "react";
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
};

const INITIAL_QUICK_ACTIONS = [
	{
		id: "decoy",
		title: "Decoy Mode",
		subtitle: "Decoy Mode is active",
		icon: Shield,
		color: "#8B5CF6",
		bg: "#F5F3FF",
		route: "DecoyScreen",
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
		subtitle: "5 Cases include encrypted evidence",
		icon: Lock,
		color: "#F59E0B",
		bg: "#FFFBEB",
		route: "VaultScreen",
	},
	
];

// import React, { useMemo } from "react";
// import {
// 	Shield,
// 	ShieldOff,
// 	MapPin,
// 	MapPinOff,
// 	AlertTriangle,
// 	Users,
// } from "lucide-react-native"; // or your icon library import

const INITIAL_RADIAL_ACTIONS = [
	{
		id: "decoy",
		icon: Shield,
		route: "DecoyScreen",
		angle: 225,
		color: "#FFFFFF",
		bg: "#7E22CE",
	},
	{
		id: "location",
		icon: MapPin,
		route: "LocationScreen",
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
		if (!name) {
			return "User";
		}

		try {
			return decryptData(name);
		} catch (error) {
			return name;
		}
	};

	const displayName = resolveDisplayName(user?.userName);

	//Fetch data whenever the screen gains focus
	useFocusEffect(
		useCallback(() => {
			let isMounted = true;

			//Fetch the total emergency contact count
			const contactFetchCount = async () => {
				const userId = user?.userId;

				if (!userId || !db) {
					return;
				}

				//Add code to fetch the emergency contact count
				const contactResult = await getLocalContactTotal(db, userId); //

				if (isMounted) {
					setContactCount(contactResult);
				}
			};

			//Methods to invoke
			contactFetchCount();

			return () => {
				isMounted = false;
			};
		}, [db, user]),
	);

	useEffect(() => {
		const checkPermissions = async () => {
			try {
				//Location
				const saveShare = await AsyncStorage.getItem(KEYS.SHARE_LOCATION);

				if (saveShare !== null) {
					setShareLiveLocation(saveShare === "true");
				}

				//Decoy
			} catch (error) {
				console.error("Error updating the home screen: ", error);
			}
		};

		checkPermissions();
	}, []);

	const quickActions = INITIAL_QUICK_ACTIONS.map((item) => {
		if (item.id === "contacts") {
			return {
				...item,
				subtitle:
					contactCount === 0
						? "No emergency contacts saved"
						: `${contactCount} user saved emergency contact${contactCount === 1 ? "" : "s"}`,
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

		if (item.id === "vault") {
			return {
				...item,
				subtitle:
					evidenceCount === 0
						? "No incident evidence has been stored yet"
						: `${evidenceCount} user saved emergency contact${evidenceCount === 1 ? "" : "s"}`,
			};
		}

		return item;
	});

	// Inside your screen component:
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
					{/* Protection Radar Component */}
					<ProtectionRadar actions={radialActions} navigation={navigation} />

					{/* Safety Tools Grid */}
					<View style={styles.toolsSection}>
						<Text style={styles.sectionTitle}>Safety Tools</Text>
						<View style={styles.grid}>
							{quickActions.map((item) => (
								<SafetyToolCard
									key={item.id}
									item={item}
									onPress={() => item.route && navigation.navigate(item.route)}
								/>
							))}
						</View>
					</View>
				</View>
			</AuthLayout>

			{/* Fixed Floating Navigation Bar */}
			<View style={styles.navWrapper}>
				<NavigationBar activeTab="Home" navigation={navigation} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		position: "relative",
	},
	content: {
		paddingHorizontal: 20,
		paddingBottom: 10,
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
	footerTagline: {
		marginTop: 20,
		fontSize: 12,
		fontWeight: "600",
		color: "#6B21A8",
		textAlign: "center",
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
