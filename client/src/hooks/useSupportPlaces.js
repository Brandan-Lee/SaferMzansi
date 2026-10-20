import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchNominatimServices } from "@services/main/nominatumServices";
import { calculateDistanceKm } from "@utils/location/geoUtils";
import { CATEGORIES } from "@constants/supportConstants";

export function useSupportPlaces(userLocation) {
	const [liveServices, setLiveServices] = useState([]);
	const [loadingApi, setLoadingApi] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [selectedId, setSelectedId] = useState(null);
	const [expandedId, setExpandedId] = useState(null);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const refreshServices = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	// Fetch Nominatim API data whenever location changes or manual refresh is triggered
	useEffect(() => {
		let isMounted = true;
		console.log(
			"[useSupportPlaces] useEffect triggered with location:",
			userLocation,
		);

		const loadApiData = async () => {
			if (!userLocation?.latitude || !userLocation?.longitude) {
				if (isMounted) setLiveServices([]);
				console.warn(
					"[useSupportPlaces] Missing latitude or longitude, skipping fetch.",
				);
				return;
			}

			setLoadingApi(true);
			setLiveServices([]);
			try {
				console.log("[useSupportPlaces] Calling fetchNominatimServices...");
				const results = await fetchNominatimServices(
					userLocation.latitude,
					userLocation.longitude,
				);
				console.log(
					"[useSupportPlaces] Results received from service:",
					results?.length || 0,
				);

				if (isMounted) {
					setLiveServices(results || []);
				}
			} catch (err) {
				console.error("[useSupportPlaces] Error loading API data:", err);
				if (isMounted) setLiveServices([]);
			} finally {
				if (isMounted) setLoadingApi(false);
			}
		};

		loadApiData();

		return () => {
			isMounted = false;
		};
	}, [userLocation, refreshTrigger]);

	// Format and calculate distances for results
	const places = useMemo(() => {
		return liveServices.map((p) => ({
			...p,
			distance: calculateDistanceKm(userLocation, p),
		}));
	}, [liveServices, userLocation]);

	// Find the nearest place in each category
	const nearestPlaces = useMemo(
		() =>
			Object.keys(CATEGORIES)
				.map(
					(cat) =>
						places
							.filter((p) => p.category === cat)
							.sort((a, b) => a.distance - b.distance)[0],
				)
				.filter(Boolean),
		[places],
	);

	// Filter visible places based on active category selection
	const visiblePlaces = selectedCategory
		? places
				.filter((p) => p.category === selectedCategory)
				.sort((a, b) => a.distance - b.distance)
		: nearestPlaces;

	return {
		places,
		visiblePlaces,
		loadingApi,
		selectedCategory,
		setSelectedCategory,
		selectedId,
		setSelectedId,
		expandedId,
		setExpandedId,
		refreshServices,
	};
}
