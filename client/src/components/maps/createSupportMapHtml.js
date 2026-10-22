const serializeForInlineScript = (value) =>
	JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");

const isValidCoordinate = (latitude, longitude) =>
	Number.isFinite(latitude) &&
	Number.isFinite(longitude) &&
	latitude >= -90 &&
	latitude <= 90 &&
	longitude >= -180 &&
	longitude <= 180;

export const createSupportMapHtml = ({
	userLocation,
	places,
	selectedId,
}) => {
	const safePlaces = places.filter((place) =>
		isValidCoordinate(place.latitude, place.longitude),
	);
	const placesJson = serializeForInlineScript(safePlaces);
	const selectedIdJson = serializeForInlineScript(selectedId ?? null);

	return `
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

				var places = ${placesJson};
				var selectedId = ${selectedIdJson};
				var userIcon = L.divIcon({
					className: 'user-pin',
					html: '<div style="background-color: #9b1c1c; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
					iconSize: [16, 16]
				});
				L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon})
					.addTo(map)
					.bindPopup("You are here");

				places.forEach(function(place) {
					var color = place.category === 'police' ? '#1d4ed8'
						: place.category === 'shelter' ? '#7e22ce' : '#15803d';
					if (place.id === selectedId) color = '#f59e0b';

					var pinIcon = L.divIcon({
						className: 'service-pin',
						html: '<div style="background-color: ' + color + '; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.4);"></div>',
						iconSize: [14, 14]
					});

					var marker = L.marker([place.latitude, place.longitude], {icon: pinIcon}).addTo(map);
					var popup = document.createElement('div');
					var name = document.createElement('strong');
					var address = document.createElement('div');
					name.textContent = place.name || 'Support service';
					address.textContent = place.address || '';
					popup.appendChild(name);
					popup.appendChild(address);
					marker.bindPopup(popup);

					marker.on('click', function() {
						window.ReactNativeWebView.postMessage(String(place.id));
					});
				});
			</script>
		</body>
		</html>
	`;
};
