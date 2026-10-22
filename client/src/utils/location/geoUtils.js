import { Linking, Platform } from "react-native";

export const isValidCoordinate = (coordinate) => {
	if (!coordinate || typeof coordinate !== "object") return false;

	const { latitude, longitude } = coordinate;
	return (
		Number.isFinite(latitude) &&
		Number.isFinite(longitude) &&
		latitude >= -90 &&
		latitude <= 90 &&
		longitude >= -180 &&
		longitude <= 180
	);
};

export const roundCoordinates = ({ latitude, longitude }) => ({
	latitude: Math.round(latitude * 100) / 100,
	longitude: Math.round(longitude * 100) / 100,
});

export const calculateDistanceKm = (a, b) => {
	if (!isValidCoordinate(a) || !isValidCoordinate(b)) {
		throw new Error("Valid coordinates are required to calculate distance.");
	}

	const toRad = (deg) => (deg * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad(b.latitude - a.latitude);
	const dLng = toRad(b.longitude - a.longitude);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(a.latitude)) *
			Math.cos(toRad(b.latitude)) *
			Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (km) =>
	km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

export const isValidPhoneNumber = (phone) => {
	if (!phone) return false;
	const clean = phone.trim().toLowerCase();
	// Check against typical missing/placeholder strings
	return (
		clean !== "" &&
		clean !== "contact via office" &&
		clean !== "not available" &&
		clean !== "n/a" &&
		clean.length > 3
	);
};

export const handlePhoneCall = async (phone) => {
	if (!isValidPhoneNumber(phone)) {
		return false;
	}

	await Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
	return true;
};

export const openDirections = ({ latitude, longitude }) => {
	if (!isValidCoordinate({ latitude, longitude })) {
		throw new Error("A valid destination is required to open directions.");
	}

	const url =
		Platform.OS === "ios"
			? `maps://app?daddr=${latitude},${longitude}&om=1`
			: `google.navigation:q=${latitude},${longitude}`;
	Linking.openURL(url);
};
