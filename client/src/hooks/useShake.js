import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export function useShake(onShake, sensitivity = 1.5) {
    const lastX = useRef(null);
    const lastY = useRef(null);
    const lastZ = useRef(null);

    useEffect(() => {
        // Check the sensor 10 times a second
        Accelerometer.setUpdateInterval(100);

        const subscription = Accelerometer.addListener((data) => {
            const { x, y, z } = data;

            if (lastX.current !== null) {
                // Calculate the absolute difference for each axis since the last tick
                const deltaX = Math.abs(x - lastX.current);
                const deltaY = Math.abs(y - lastY.current);
                const deltaZ = Math.abs(z - lastZ.current);

                // Sum the delta movement
                const totalDelta = deltaX + deltaY + deltaZ;

                console.log("Current Delta Force:", totalDelta);

                // A standard deliberate shake will easily cross a threshold of 1.5 - 2.0
                if (totalDelta > sensitivity) {
                    console.log("SHAKE TRIGGERED!");
                    onShake();
                }
            }

            // Track coordinates for the next interval
            lastX.current = x;
            lastY.current = y;
            lastZ.current = z;
        });

        return () => {
            subscription.remove();
        };
    }, [onShake, sensitivity]);
}
