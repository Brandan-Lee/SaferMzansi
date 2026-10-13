import React, { useContext, useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthContext } from "@context/AuthContext";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import DecoyScreen from "@screens/decoy/DecoyScreen";
import EmergencyContactsScreen from "@screens/main/emergencyContacts/EmergencyContactsScreen";

const Stack = createNativeStackNavigator();
const DECOY_LAUNCH_KEY = "@setting_launch_decoy";

export default function AppNavigator() {
	const { sessionToken, user, pendingAuthRoute, pendingAuthParams } =
		useContext(AuthContext);

	const [isCheckingLaunch, setIsCheckingLaunch] = useState(true);
	const [launchAsDecoy, setLaunchAsDecoy] = useState(false);
	const [isDecoyUnlocked, setIsDecoyUnlocked] = useState(false);

	useEffect(() => {
		const checkStartupPreference = async () => {
			try {
				const savedToggle = await AsyncStorage.getItem(DECOY_LAUNCH_KEY);
				if (savedToggle === "true") {
					setLaunchAsDecoy(true);
				}
			} catch (error) {
				console.error("Failed to load decoy launch preference", error);
			} finally {
				setIsCheckingLaunch(false);
			}
		};

		checkStartupPreference();
	}, []);

	return (
		<NavigationContainer>
			{sessionToken ? (
				<MainStack user={user} />
			) : launchAsDecoy && !isDecoyUnlocked ? (
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name="DecoyScreen">
						{() => <DecoyScreen onUnlock={() => setIsDecoyUnlocked(true)} />}
					</Stack.Screen>
					<Stack.Screen
						name="EmergencyContactsScreen"
						component={EmergencyContactsScreen}
					/>
				</Stack.Navigator>
			) : (
				<AuthStack
					initialRoute={pendingAuthRoute || "LoginScreen"}
					initialParams={pendingAuthParams}
				/>
			)}
		</NavigationContainer>
	);
}

const styles = StyleSheet.create({
	loaderContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},
});
