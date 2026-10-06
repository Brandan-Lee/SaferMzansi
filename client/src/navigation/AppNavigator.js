import React, { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthContext } from "@context/AuthContext";
import AuthStack from "./AuthStack";

import HomeScreen from "@screens/main/HomeScreen";
import EmergencyContactsScreen from "@screens/main/emergencyContacts/EmergencyContactsScreen";
import AddContactScreen from "@screens/main/emergencyContacts/AddContactScreen";
import ContactDetailsScreen from "@screens/main/emergencyContacts/ContactDetailsScreen";

const Stack = createNativeStackNavigator();

function MainStack({ user }) {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
			initialRouteName="HomeScreen"
		>
			<Stack.Screen
				name="HomeScreen"
				component={HomeScreen}
				initialParams={{
					userName: user?.userName,
					userId: user?.userId,
				}}
			/>
			<Stack.Screen
				name="EmergencyContactsScreen"
				component={EmergencyContactsScreen}
			/>
			<Stack.Screen name="AddContactScreen" component={AddContactScreen} />
			<Stack.Screen
				name="ContactDetailsScreen"
				component={ContactDetailsScreen}
			/>
		</Stack.Navigator>
	);
}

export default function AppNavigator() {
	const { sessionToken, user } = useContext(AuthContext);

	// if (loading) {
	// 	return (
	// 		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
	// 			<ActivityIndicator size="large" />
	// 		</View>
	// 	);
	// }

	return (
		<NavigationContainer>
			{sessionToken ? <MainStack user={user} /> : <AuthStack />}
		</NavigationContainer>
	);
}
