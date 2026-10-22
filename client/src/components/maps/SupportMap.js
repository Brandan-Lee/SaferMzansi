import React, { useRef, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { THEME } from "@constants/supportConstants";
import { isValidCoordinate } from "@utils/location/geoUtils";
import { createSupportMapHtml } from "./createSupportMapHtml";

export default function SupportMap({
	mapRef,
	userLocation,
	places = [],
	selectedCategory,
	selectedId,
	loading,
	onSelectMarker,
}) {
	const webViewRef = useRef(null);

	// Expose custom map methods to mapRef
	useEffect(() => {
		if (mapRef) {
			mapRef.current = {
				animateToRegion: (region) => {
					if (
						!region ||
						!isValidCoordinate(region)
					) {
						return;
					}
					webViewRef.current?.injectJavaScript(`
						if (typeof map !== 'undefined') {
							map.setView([${region.latitude}, ${region.longitude}], 14);
						}
						true;
					`);
				},
				fitToCoordinates: (coords) => {
					const validCoords = coords?.filter((coordinate) =>
						isValidCoordinate(coordinate),
					);
					if (!validCoords?.length) return;
					const lats = validCoords.map((coordinate) => coordinate.latitude);
					const lons = validCoords.map((coordinate) => coordinate.longitude);
					const minLat = Math.min(...lats);
					const maxLat = Math.max(...lats);
					const minLon = Math.min(...lons);
					const maxLon = Math.max(...lons);

					webViewRef.current?.injectJavaScript(`
						if (typeof map !== 'undefined') {
							map.fitBounds([[${minLat}, ${minLon}], [${maxLat}, ${maxLon}]], { padding: [50, 50] });
						}
						true;
					`);
				},
			};
		}
	}, [mapRef]);

	// Guard against uninitialized userLocation
	if (
		!userLocation ||
		!isValidCoordinate(userLocation)
	) {
		return (
			<View style={[styles.mapFrame, styles.mapLoading]}>
				<ActivityIndicator color={THEME.purple} size="large" />
			</View>
		);
	}

	const filteredPlaces = places.filter(
		(p) => !selectedCategory || p.category === selectedCategory,
	);

	const mapHtml = createSupportMapHtml({
		userLocation,
		places: filteredPlaces,
		selectedId,
	});

	return (
		<View style={styles.mapFrame}>
			<WebView
				ref={webViewRef}
				source={{ html: mapHtml }}
				style={styles.map}
				scrollEnabled={false}
				onMessage={(event) => {
					const placeId = event.nativeEvent.data;
					if (onSelectMarker) onSelectMarker(placeId);
				}}
			/>
			{loading && (
				<View style={styles.mapLoading}>
					<ActivityIndicator color={THEME.purple} />
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	mapFrame: {
		height: 300,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: THEME.purple,
		overflow: "hidden",
	},
	map: { flex: 1, backgroundColor: "transparent" },
	mapLoading: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,255,255,0.8)",
	},
});
