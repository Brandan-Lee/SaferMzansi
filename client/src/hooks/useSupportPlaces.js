import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchGeoapifyServices } from "@services/main/geoapifyService";
import { calculateDistanceKm } from "@utils/location/geoUtils";
import { CATEGORIES } from "@constants/supportConstants";

export function useSupportPlaces(userLocation, { enabled = true } = {}) {
	const [liveServices, setLiveServices] = useState([]);
	const [loadingApi, setLoadingApi] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [selectedId, setSelectedId] = useState(null);
	const [expandedId, setExpandedId] = useState(null);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const refreshServices = useCallback(() => {
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	// Fetch nearby services whenever location changes or manual refresh is triggered
	useEffect(() => {
		let isMounted = true;
		const loadApiData = async () => {
			if (!enabled) {
				// Do not query nearby places before the user enables location or connectivity.
				setLiveServices([]);
				setLoadingApi(false);
				return;
			}

			if (
				!Number.isFinite(userLocation?.latitude) ||
				!Number.isFinite(userLocation?.longitude)
			) {
				if (isMounted) setLiveServices([]);
				console.warn(
					"[useSupportPlaces] Missing latitude or longitude, skipping fetch.",
				);
				return;
			}

			setLoadingApi(true);
			setLiveServices([]);
			try {
				const results = await fetchGeoapifyServices(
					userLocation.latitude,
					userLocation.longitude,
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
	}, [enabled, userLocation, refreshTrigger]);

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
