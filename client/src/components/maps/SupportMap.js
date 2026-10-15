import React, { useRef, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { THEME } from "@constants/supportConstants";

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
					if (!region) return;
					webViewRef.current?.injectJavaScript(`
						if (typeof map !== 'undefined') {
							map.setView([${region.latitude}, ${region.longitude}], 14);
						}
						true;
					`);
				},
				fitToCoordinates: (coords) => {
					if (!coords || coords.length === 0) return;
					const lats = coords.map((c) => c.latitude);
					const lons = coords.map((c) => c.longitude);
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
		typeof userLocation.latitude !== "number" ||
		typeof userLocation.longitude !== "number"
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

	const mapHtml = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
			<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
			<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
			<style>
				body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #f0f0f0; }
				#map { height: 100%; width: 100%; }
			</style>
		</head>
		<body>
			<div id="map"></div>
			<script>
				var map = L.map('map', { 
					zoomControl: false,
					maxBounds: null,
					maxBoundsViscosity: 0.0
				}).setView([${userLocation.latitude}, ${userLocation.longitude}], 14);

				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					noWrap: false,
					attribution: ''
				}).addTo(map);

				var userIcon = L.divIcon({
					className: 'user-pin',
					html: '<div style="background-color: #9b1c1c; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
					iconSize: [16, 16]
				});
				L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon}).addTo(map).bindPopup("You are here");

				var places = ${JSON.stringify(filteredPlaces)};
				places.forEach(function(place) {
					var color = place.category === 'police' ? '#1d4ed8' : place.category === 'shelter' ? '#7e22ce' : '#15803d';
					if (place.id === '${selectedId}') color = '#f59e0b';

					var pinIcon = L.divIcon({
						className: 'service-pin',
						html: '<div style="background-color: ' + color + '; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.4);"></div>',
						iconSize: [14, 14]
					});
					
					var marker = L.marker([place.latitude, place.longitude], {icon: pinIcon}).addTo(map);
					marker.bindPopup("<b>" + place.name + "</b><br>" + place.address);
					
					marker.on('click', function() {
						window.ReactNativeWebView.postMessage(place.id);
					});
				});
			</script>
		</body>
		</html>
	`;

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
