import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@screens/auth/LoginScreen";
import OTPScreen from "@screens/auth/OTPScreen";
import ResetPasswordScreen from "@screens/auth/ResetPasswordScreen";
import ForgotPasswordScreen from "@screens/auth/ForgotPasswordScreen";
import RegistrationScreen from "@screens/auth/RegistrationScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack({
	initialRoute = "LoginScreen",
	initialParams,
}) {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
			initialRouteName={initialRoute}
		>
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
