import React, { createContext, useContext } from "react";
import { useNetInfo } from "@react-native-community/netinfo";

// Treat an unavailable network provider as offline until connectivity is known.
const NetworkContext = createContext({
	isOnline: false,
	isConnected: false,
	isInternetReachable: false,
	connectionType: "none",
});

export const NetStatusProvider = ({ children }) => {
	const netInfo = useNetInfo();

	const isOnline = Boolean(
		netInfo.isConnected && netInfo.isInternetReachable !== false,
	);

	const value = {
		isOnline,
		isConnected: netInfo.isConnected,
		isInternetReachable: netInfo.isInternetReachable,
		connectionType: netInfo.type || "none",
	};

	return (
		<NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
	);
};

export const useNetStatus = () => useContext(NetworkContext);
