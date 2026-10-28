import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthContext } from "@context/AuthContext";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import DecoyScreen from "@screens/decoy/DecoyScreen";
import SOSScreen from "@screens/main/emergencyTrigger/SOSScreen";
import { STORAGE_KEYS } from "@constants/storageKeys";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ navigationRef, onNavigationReady }) {
	const {
		sessionToken,
		hasActiveLogin,
		user,
		pendingAuthRoute,
		pendingAuthParams,
		checkAuthSession,
		logOut,
	} = useContext(AuthContext);

	const [isCheckingLaunch, setIsCheckingLaunch] = useState(true);
	const [launchAsDecoy, setLaunchAsDecoy] = useState(false);
	const [isDecoyUnlocked, setIsDecoyUnlocked] = useState(false);

	const handleEmergencyCancel = async () => {
		let shouldLaunchDecoy = false;
		try {
			shouldLaunchDecoy =
				(await AsyncStorage.getItem(STORAGE_KEYS.LAUNCH_DECOY)) === "true";
		} catch (error) {
			console.error("Failed to load decoy launch preference after SOS cancel", error);
		}

		setLaunchAsDecoy(shouldLaunchDecoy);
		setIsDecoyUnlocked(false);
		await logOut("LoginScreen");
		navigationRef?.current?.resetRoot({
			index: 0,
			routes: [{ name: "AppContent" }],
		});
	};

	const handleEmergencyClose = () => {
		navigationRef?.current?.resetRoot({
			index: 0,
			routes: [{ name: "AppContent" }],
		});
	};

	useEffect(() => {
		const initializeApp = async () => {
			try {
				await checkAuthSession();
			} catch (error) {
				console.error("Failed to restore the previous app session", error);
			}

			try {
				const savedToggle = await AsyncStorage.getItem(
					STORAGE_KEYS.LAUNCH_DECOY,
				);
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
	}, [checkAuthSession]);

	if (isCheckingLaunch) {
		return null;
	}

	return (
		<NavigationContainer
			ref={navigationRef}
			onReady={onNavigationReady}
		>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="AppContent">
					{() =>
						// The decoy launch preference must take priority over a saved session.
						launchAsDecoy && !isDecoyUnlocked ? (
							<Stack.Navigator screenOptions={{ headerShown: false }}>
								<Stack.Screen name="DecoyScreen">
									{() => (
										<DecoyScreen
											onDecoyUnlock={() => setIsDecoyUnlocked(true)}
											onEmergencyUnlock={({ isTesting }) =>
												navigationRef?.current?.navigate("SOSScreen", {
													isTesting,
												})
											}
										/>
									)}
								</Stack.Screen>
							</Stack.Navigator>
						) : hasActiveLogin && sessionToken ? (
							<MainStack user={user} />
						) : (
							<AuthStack
								initialRoute={pendingAuthRoute || "SplashScreen"}
								initialParams={pendingAuthParams}
							/>
						)
					}
				</Stack.Screen>
				<Stack.Screen name="SOSScreen">
					{(screenProps) => (
						<SOSScreen
							{...screenProps}
							onCancel={handleEmergencyCancel}
							onClose={handleEmergencyClose}
						/>
					)}
				</Stack.Screen>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
