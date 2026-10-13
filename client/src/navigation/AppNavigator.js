import React, { useContext } from "react";
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
import DecoyPinScreen from "@screens/main/settings/DecoyPinScreen";
import ProfileScreen from "@screens/main/settings/Profile/ProfileScreen";
import EditProfileScreen from "@screens/main/settings/Profile/EditProfileScreen";
import SettingsScreen from "@screens/main/settings/SettingsScreen";

const Stack = createNativeStackNavigator();

function MainStack({ user }) {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
			//Change this to the screen name that you wish to work on... so HomeScreen to SettingsScreen for instance
			initialRouteName="DecoyScreen"
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
			<Stack.Screen name="DecoyPinScreen" component={DecoyPinScreen} />
			<Stack.Screen name="ProfileScreen" component={ProfileScreen} />
			<Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
			<Stack.Screen name="SettingsScreen" component={SettingsScreen} />
		</Stack.Navigator>
	);
}

export default function AppNavigator() {
	const { sessionToken, user, pendingAuthRoute, pendingAuthParams } =
		useContext(AuthContext);

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
			{/* {sessionToken ? <MainStack user={user} /> : <AuthStack />} */}
			<MainStack />
			{sessionToken ? (
				<MainStack user={user} />
			) : (
				<AuthStack
					initialRoute={pendingAuthRoute || "LoginScreen"}
					initialParams={pendingAuthParams}
				/>
			)}
			{/* <MainStack /> */}
		</NavigationContainer>
	);
}
