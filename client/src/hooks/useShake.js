import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { Vibration } from "react-native";

export function useShake(
	onShake,
	sensitivity = 0.35,
	timeout = 1500,
	coolDownMs = 60000,
) {
	const lastX = useRef(null);
	const lastY = useRef(null);
	const lastZ = useRef(null);

	const shakeCount = useRef(0);
	const timer = useRef(null);

	const lastTime = useRef(0);
	const lastTriggerTime = useRef(0);

	const savedOnShake = useRef(onShake);
	useEffect(() => {
		savedOnShake.current = onShake;
	}, [onShake]);

	useEffect(() => {
		let subscription;
		let cancelled = false;
		lastX.current = null;
		lastY.current = null;
		lastZ.current = null;
		shakeCount.current = 0;

		const startListening = async () => {
			try {
				const isAvailable = await Accelerometer.isAvailableAsync();
				if (!isAvailable) {
					console.warn("Shake gesture is unavailable: no accelerometer found.");
					return;
				}
				if (cancelled) return;

				Accelerometer.setUpdateInterval(100);
				subscription = Accelerometer.addListener((data) => {
					const { x, y, z } = data;
					const now = Date.now();

					if (now - lastTriggerTime.current < coolDownMs) {
						lastX.current = x;
						lastY.current = y;
						lastZ.current = z;
						return;
					}

					if (lastX.current !== null) {
						const totalDelta =
							Math.abs(x - lastX.current) +
							Math.abs(y - lastY.current) +
							Math.abs(z - lastZ.current);

						if (totalDelta > sensitivity && now - lastTime.current > 100) {
							lastTime.current = now;
							shakeCount.current += 1;

							if (timer.current) clearTimeout(timer.current);
							timer.current = setTimeout(() => {
								shakeCount.current = 0;
								timer.current = null;
							}, timeout);

							if (shakeCount.current >= 2) {
								if (timer.current) clearTimeout(timer.current);
								timer.current = null;
								shakeCount.current = 0;
								lastTriggerTime.current = Date.now();
								Vibration.vibrate(500);
								savedOnShake.current?.();
							}
						}
					}

					lastX.current = x;
					lastY.current = y;
					lastZ.current = z;
				});
			} catch (error) {
				console.error("Failed to start shake detection:", error);
			}
		};

		startListening();

		return () => {
			cancelled = true;
			subscription?.remove();
			if (timer.current) clearTimeout(timer.current);
			timer.current = null;
		};
	}, [sensitivity, timeout, coolDownMs]);
}
