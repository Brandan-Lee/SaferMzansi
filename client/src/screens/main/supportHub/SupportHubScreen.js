import React, { useCallback, useMemo, useRef, useState } from "react";
import { Text, ScrollView, StyleSheet, View, Alert } from "react-native";

import {
	DEFAULT_LOCATION,
	HELPLINES,
	THEME,
} from "@constants/supportConstants";
import { roundCoordinates, handlePhoneCall } from "@utils/location/geoUtils";

import SupportMap from "@components/maps/SupportMap";
import LocationSegmentSelector from "@components/common/LocationSegmentSelector";
import CategoryLegend from "@components/common/CategoryLegend";
import ServiceCard from "@components/cards/ServiceCard";
import HelplineCard from "@components/cards/HelplineCard";
import { useFocusEffect } from "@react-navigation/native";
import SupportHubNotice from "./SupportHubNotice";
import { useLocation } from "@hooks/useLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSupportPlaces } from "@hooks/useSupportPlaces";
import { useNetStatus } from "@utils/network/netStatus";
import { STORAGE_KEYS } from "@constants/storageKeys";
import MainLayout from "@components/layouts/MainLayout";

export default function SupportHubScreen({ navigation }) {
	const mapRef = useRef(null);
	const [mode, setMode] = useState("approximate");
	const [isLocationAllowed, setIsLocationAllowed] = useState(null);
	const {
		location,
		error,
		loading: locationLoading,
		getLocation,
	} = useLocation();
	const { isOnline } = useNetStatus();

	useFocusEffect(
		useCallback(() => {
			let isActive = true;
			const checkStoredLocationSettings = async () => {
				try {
					const savedShare = await AsyncStorage.getItem(
						STORAGE_KEYS.SHARE_LOCATION,
					);
					const allowed = savedShare === "true";
					if (!isActive) return;
					setIsLocationAllowed(allowed);
					if (allowed && isOnline) {
						await getLocation(mode === "exact");
					}
				} catch (error) {
					console.error("Failed to load location setting", error);
				}
			};

			checkStoredLocationSettings();
			return () => {
				isActive = false;
			};
		}, [getLocation, isOnline, mode]),
	);

	const onAttemptCall = async (place) => {
		try {
			const callStarted = await handlePhoneCall(place.phone);
			if (!callStarted) {
				Alert.alert("Call unavailable", "No valid phone number is available.");
			}
		} catch (error) {
			console.error("Failed to open the phone dialer:", error);
			Alert.alert("Call unavailable", "Could not open the phone dialer.");
		}
	};

	const userLocation = useMemo(() => {
		if (!location) {
			return DEFAULT_LOCATION;
		}

		return mode === "exact" ? location : roundCoordinates(location);
	}, [location, mode]);

	const {
		places,
		visiblePlaces,
		loadingApi,
		selectedCategory,
		setSelectedCategory,
		selectedId,
		setSelectedId,
		expandedId,
		setExpandedId,
	} = useSupportPlaces(userLocation, {
		enabled: isLocationAllowed === true && isOnline && Boolean(location),
	});

	if (isLocationAllowed === false) {
		return (
			<SupportHubNotice
				navigation={navigation}
				icon="location-outline"
				title="Location Access Disabled"
				message={
					'The Support Hub needs location access to find nearby safety and medical facilities. Enable "Location for emergency alerts" in Settings to continue.'
				}
				showSettingsButton
			/>
		);
	}

	if (!isOnline) {
		return (
			<SupportHubNotice
				navigation={navigation}
				icon="cloud-offline-outline"
				title="Network Connection Disabled"
				message="The Support Hub needs a live network connection to find nearby safety and medical facilities. Enable mobile data or Wi-Fi to continue."
			/>
		);
	}

	const handleSelectCategory = (cat) => {
		const next = selectedCategory === cat ? null : cat;
		setSelectedCategory(next);
		setSelectedId(null);
		setExpandedId(null);

		if (!next) {
			mapRef.current?.animateToRegion(
				{ ...userLocation, latitudeDelta: 0.12, longitudeDelta: 0.12 },
				500,
			);
			return;
		}

		const coords = places
			.filter((p) => p.category === next)
			.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

		if (coords.length > 0) {
			mapRef.current?.fitToCoordinates([userLocation, ...coords], {
				edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
				animated: true,
			});
		}
	};

	const handleFocusPlace = (place) => {
		setSelectedId(place.id);
		mapRef.current?.animateToRegion(
			{
				latitude: place.latitude,
				longitude: place.longitude,
				latitudeDelta: 0.04,
				longitudeDelta: 0.04,
			},
			500,
		);
	};

	return (
		<MainLayout
			title="Support Hub"
			onBack={() => navigation.goBack()}
			tab="Support Hub"
			navigation={navigation}
		>
			<ScrollView
				contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				<SupportMap
					mapRef={mapRef}
					userLocation={userLocation}
					locationShared={!!location}
					mode={mode}
					places={places}
					selectedCategory={selectedCategory}
					selectedId={selectedId}
					loading={locationLoading || loadingApi}
					onSelectMarker={(id) => setSelectedId(id)}
				/>

				<LocationSegmentSelector
					mode={mode}
					onSelectMode={(newMode) => {
						setMode(newMode);
						getLocation(newMode === "exact");
					}}
				/>
				<Text
					style={{ fontSize: 12, color: "#555", marginTop: 6, marginLeft: 2 }}
				>
					{error
						? "Location unavailable"
						: "Showing live local support services"}
				</Text>

				<Text
					style={{
						fontSize: 16,
						fontWeight: "700",
						color: THEME.title,
						marginTop: 20,
						marginBottom: 10,
					}}
				>
					Legend
				</Text>
				<CategoryLegend
					selectedCategory={selectedCategory}
					onSelectCategory={handleSelectCategory}
				/>

				{visiblePlaces.length === 0 && !loadingApi && (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>
							No live support services found nearby right now (API rate-limited
							or none mapped in this immediate zone).
						</Text>
					</View>
				)}

				{visiblePlaces.map((place) => (
					<ServiceCard
						key={place.id}
						place={place}
						selected={selectedId === place.id}
						expanded={expandedId === place.id}
						onSelect={() => handleFocusPlace(place)}
						onToggleExpand={() =>
							setExpandedId(expandedId === place.id ? null : place.id)
						}
						onAttemptCall={() => onAttemptCall(place)}
					/>
				))}

				<Text
					style={{
						fontSize: 16,
						fontWeight: "700",
						color: THEME.title,
						marginTop: 20,
						marginBottom: 10,
					}}
				>
					Helplines
				</Text>
				{HELPLINES.map((h) => (
					<HelplineCard key={h.phone} helpline={h} onPress={() => {}} />
				))}
			</ScrollView>
		</MainLayout>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		padding: 20,
		alignItems: "center",
		backgroundColor: "#f9f9f9",
		borderRadius: 10,
		marginVertical: 10,
		borderWidth: 1,
		borderColor: "#eee",
	},
	emptyText: {
		fontSize: 13,
		color: "#666",
		textAlign: "center",
		lineHeight: 18,
	},
	bannerContainer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
		gap: 8,
	},
	bannerError: {
		backgroundColor: "#FDE8E8",
		borderWidth: 1,
		borderColor: "#F8B4B4",
	},
	bannerInfo: {
		backgroundColor: "#E1EFFE",
		borderWidth: 1,
		borderColor: "#C3DDFD",
	},
	bannerText: {
		fontSize: 13,
		color: "#1F2937",
		flex: 1,
		fontWeight: "500",
	},
});
