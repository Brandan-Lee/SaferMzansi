import { useState, useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as Location from "expo-location";

export function useLocation() {
	const [location, setLocation] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	// Accept wantExact to toggle between High and Balanced accuracy
	const getLocation = useCallback(async (wantExact = false) => {
		setLoading(true);
		setError(null);
		try {
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				const errMsg = "Permission to access location was denied";
				setError(errMsg);
				return { success: false, error: errMsg };
			}

			// Optional iOS reduced accuracy check
			if (wantExact && Platform.OS === "ios") {
				const permission = await Location.getForegroundPermissionsAsync();
				if (permission.ios?.accuracy === "reduced") {
					Alert.alert(
						"Precise location is off",
						"Your phone is only sharing an approximate location. To share your exact location, turn on Precise Location in Settings.",
					);
				}
			}

			// Fetch current position based on desired accuracy
			let currentLocation = await Location.getCurrentPositionAsync({
				accuracy: wantExact
					? Location.Accuracy.High
					: Location.Accuracy.Balanced,
			});

			const coords = {
				latitude: currentLocation.coords.latitude,
				longitude: currentLocation.coords.longitude,
			};

			setLocation(coords);
			return { success: true, location: coords };
		} catch (err) {
			const errMsg =
				err.message || "Something went wrong when fetching your location.";
			setError(errMsg);
			return { success: false, error: errMsg };
		} finally {
			setLoading(false);
		}
	}, []);

	return { location, error, loading, getLocation };
}
