import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "@screens/auth/LoginScreen";
import RegistrationScreen from "@screens/auth/RegistrationScreen";
import OTPScreen from "@screens/auth/OTPScreen";
import ForgotPasswordScreen from "@screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "@screens/auth/ResetPasswordScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
			initialRouteName="LoginScreen"
		>
			<Stack.Screen name="LoginScreen" component={LoginScreen} />
			<Stack.Screen name="RegistrationScreen" component={RegistrationScreen} />
			<Stack.Screen name="OTPScreen" component={OTPScreen} />
			<Stack.Screen
				name="ForgotPasswordScreen"
				component={ForgotPasswordScreen}
			/>
			<Stack.Screen
				name="ResetPasswordScreen"
				component={ResetPasswordScreen}
			/>
		</Stack.Navigator>
	);
}
