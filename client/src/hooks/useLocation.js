import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Turn this into an executable trigger action
    const getLocation = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                const errMsg = 'Permission to access location was denied';
                setError(errMsg);
                return { success: false, error: errMsg };
            }

            //Fetch the highly accurate current location when triggered. 
            let currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            const coords = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };

            setLocation(coords);
            return { success: true, location: coords };
        } catch (err) {
            const errMsg = err.message || 'Something went wrong when fetching your location.';
            setError(errMsg);
            return { success: false, error: errMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    return { location, error, loading, getLocation };
}
