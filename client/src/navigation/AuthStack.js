import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@screens/auth/LoginScreen";
import OTPScreen from "@screens/auth/OTPScreen";
import ResetPasswordScreen from "@screens/auth/ResetPasswordScreen";
import ForgotPasswordScreen from "@screens/auth/ForgotPasswordScreen";
import RegistrationScreen from "@screens/auth/RegistrationScreen";
import SplashScreen from "@screens/main/SplashScreen";

const Stack = createNativeStackNavigator();
const SCREEN_OPTIONS = { headerShown: false };

export default function AuthStack({
	initialRoute = "SplashScreen",
	initialParams,
}) {
	return (
		<Stack.Navigator
			screenOptions={SCREEN_OPTIONS}
			initialRouteName={initialRoute}
		>
			<Stack.Screen name="SplashScreen" component={SplashScreen} />
			<Stack.Screen name="LoginScreen" component={LoginScreen} />
			<Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
			<Stack.Screen
				name="ForgotPasswordScreen"
				component={ForgotPasswordScreen}
			/>
			<Stack.Screen
				name="OTPScreen"
				component={OTPScreen}
				initialParams={initialParams}
			/>
			<Stack.Screen
				name="ResetPasswordScreen"
				component={ResetPasswordScreen}
			/>
		</Stack.Navigator>
	);
}
