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
import EditContactScreen from "@screens/main/emergencyContacts/EditContactScreen";
import DecoyScreen from "@screens/main/DecoyScreen";
import ProfileScreen from "@screens/main/settings/ProfileScreen";

const Stack = createNativeStackNavigator();

function MainStack({ user }) {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
			//Change this to the screen name that you wish to work on... so HomeScreen to SettingsScreen for instance
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
			<Stack.Screen name="EditContactScreen" component={EditContactScreen} />
			<Stack.Screen name="DecoyScreen" component={DecoyScreen} />
			<Stack.Screen name="ProfileScreen" component={ProfileScreen} />
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
			{/* Change the following line to use the second commented one rather than this one */}
			{sessionToken ? <MainStack user={user} /> : <AuthStack />}
			{/* <MainStack /> */}
		</NavigationContainer>
	);
}
