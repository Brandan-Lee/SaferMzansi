import React, { createContext, useContext } from "react";
import { useNetInfo } from "@react-native-community/netinfo";

//Default values for context
const NetworkContext = createContext({
	isOnline: true,
	isConnected: true,
	isInternetReachable: true,
	connectionType: "unknown",
});

export const NetStatusProvider = ({children}) => {

	const netInfo = useNetInfo();

	const isOnline = Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false);

	const value ={isOnline, isConnected: netInfo.isConnected, isInternetReachable: netInfo.isInternetReachable, connectionType: netInfo.type || "none",};

	return (
		<NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
	);
};

export const useNetStatus = () => useContext(NetworkContext);