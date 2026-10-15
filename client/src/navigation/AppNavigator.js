import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthContext } from "@context/AuthContext";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import DecoyScreen from "@screens/decoy/DecoyScreen";

const Stack = createNativeStackNavigator();
const DECOY_LAUNCH_KEY = "@setting_launch_decoy";

export default function AppNavigator() {
	const { sessionToken, user, pendingAuthRoute, pendingAuthParams, logOut } =
		useContext(AuthContext);

	const [isCheckingLaunch, setIsCheckingLaunch] = useState(true);
	const [launchAsDecoy, setLaunchAsDecoy] = useState(false);
	const [isDecoyUnlocked, setIsDecoyUnlocked] = useState(false);
	const [emergencyTriggered, setEmergencyTriggered] = useState(false);

	useEffect(() => {
		const initializeApp = async () => {
			try {
				await logOut();
			} catch (error) {
				console.error("Failed to clear the previous app session", error);
			}

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

		initializeApp();
	}, [logOut]);

	if (isCheckingLaunch) {
		return null;
	}

	const showMainStack =
		(emergencyTriggered && !isDecoyUnlocked) || Boolean(sessionToken);

	return (
		<NavigationContainer>
			{showMainStack ? (
				<MainStack
					user={user}
					initialRouteName={
						emergencyTriggered ? "EmergencyContactsScreen" : "HomeScreen"
					}
				/>
			) : launchAsDecoy && !isDecoyUnlocked ? (
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name="DecoyScreen">
						{() => (
							<DecoyScreen
								onDecoyUnlock={() => setIsDecoyUnlocked(true)}
								onEmergencyUnlock={() => setEmergencyTriggered(true)}
							/>
						)}
					</Stack.Screen>
				</Stack.Navigator>
			) : (
				<AuthStack
					initialRoute={
						isDecoyUnlocked ? "LoginScreen" : pendingAuthRoute || "LoginScreen"
					}
					initialParams={isDecoyUnlocked ? undefined : pendingAuthParams}
				/>
			)}
		</NavigationContainer>
	);
}
