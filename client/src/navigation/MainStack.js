import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "@screens/main/HomeScreen";
import EmergencyContactsScreen from "@screens/main/emergencyContacts/EmergencyContactsScreen";
import AddContactScreen from "@screens/main/emergencyContacts/AddContactScreen";
import ContactDetailsScreen from "@screens/main/emergencyContacts/ContactDetailsScreen";
import EditContactScreen from "@screens/main/emergencyContacts/EditContactScreen";
import DecoyScreen from "@screens/decoy/DecoyScreen";
import DecoyPinScreen from "@screens/main/settings/decoy/DecoyPinScreen";
import SettingsScreen from "@screens/main/settings/SettingsScreen";
import ProfileScreen from "@screens/main/settings/profile/ProfileScreen";
import EditProfileScreen from "@screens/main/settings/profile/EditProfileScreen";

const Stack = createNativeStackNavigator();

export default function MainStack({ user }) {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
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
