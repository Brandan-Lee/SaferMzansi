import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";

import { AuthContext } from "@context/AuthContext";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";

export default function AppNavigator() {
	const { sessionToken, user, pendingAuthRoute, pendingAuthParams } =
		useContext(AuthContext);

	return (
		<NavigationContainer>
			{sessionToken ? (
				<MainStack user={user} />
			) : (
				<AuthStack
					initialRoute={pendingAuthRoute || "LoginScreen"}
					initialParams={pendingAuthParams}
				/>
			)}
		</NavigationContainer>
	);
}
