import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "@screens/main/HomeScreen";
import EmergencyContactsScreen from "@screens/main/emergencyContacts/EmergencyContactsScreen";
import AddContactScreen from "@screens/main/emergencyContacts/AddContactScreen";
import ContactDetailsScreen from "@screens/main/emergencyContacts/ContactDetailsScreen";
import EditContactScreen from "@screens/main/emergencyContacts/EditContactScreen";
import DecoyScreen from "@screens/decoy/DecoyScreen"; // <-- Bring back DecoyScreen
import SettingsScreen from "@screens/main/settings/SettingsScreen";
import DecoyConfigurationScreen from "@screens/main/settings/decoy/DecoyConfigurationScreen";
import DecoyAddScreen from "@screens/main/settings/decoy/DecoyAddScreen";
import DecoyUpdateScreen from "@screens/main/settings/decoy/DecoyUpdateScreen";
import ProfileScreen from "@screens/main/settings/Profile/ProfileScreen";
import EditProfileScreen from "@screens/main/settings/Profile/EditProfileScreen";
import SupportHubScreen from "@screens/main/supportHub/SupportHubScreen";
import EmergencyTimerConfigScreen from "@screens/main/settings/panicTrigger/EmergencyTimerConfigScreen";
import EvidenceVaultScreen from "@screens/evidence/EvidenceVaultScreen";
import EvidenceVaultDetailsScreen from "@screens/evidence/EvidenceVaultDetailsScreen";
import RecycleBinScreen from "@screens/evidence/RecycleBinScreen";
import SOSScreen from "@screens/main/emergencyTrigger/SOSScreen";

const Stack = createNativeStackNavigator();

export default function MainStack({
	user,
	onSosClose,
	initialRouteName = "HomeScreen",
}) {
	return (
		<Stack.Navigator
			screenOptions={{ headerShown: false }}
			initialRouteName={initialRouteName}
		>
			<Stack.Screen
				name="HomeScreen"
				component={HomeScreen}
				initialParams={{
					userName: user?.userName,
					userId: user?.userId,
				}}
			/>
			<Stack.Screen name="DecoyScreen" component={DecoyScreen} />
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
			<Stack.Screen name="ProfileScreen" component={ProfileScreen} />
			<Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
			<Stack.Screen name="SettingsScreen" component={SettingsScreen} />
			<Stack.Screen
				name="DecoyConfigurationScreen"
				component={DecoyConfigurationScreen}
			/>
			<Stack.Screen name="DecoyAddScreen" component={DecoyAddScreen} />
			<Stack.Screen name="DecoyUpdateScreen" component={DecoyUpdateScreen} />
			<Stack.Screen name="SupportHubScreen" component={SupportHubScreen} />
			<Stack.Screen
				name="EmergencyTimerConfigScreen"
				component={EmergencyTimerConfigScreen}
			/>
			<Stack.Screen
				name="EvidenceVaultScreen"
				component={EvidenceVaultScreen}
			/>
			<Stack.Screen
				name="EvidenceVaultDetailsScreen"
				component={EvidenceVaultDetailsScreen}
			/>
			<Stack.Screen name="RecycleBinScreen" component={RecycleBinScreen} />
			<Stack.Screen name="SOSScreen">
				{(screenProps) => (
					<SOSScreen {...screenProps} onClose={onSosClose} />
				)}
			</Stack.Screen>
		</Stack.Navigator>
	);
}
