import { useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { Vibration } from "react-native";

export function useShake(
	onShake,
	sensitivity = 0.5,
	timeout = 500,
	coolDownMs = 60000,
) {
	const lastX = useRef(null);
	const lastY = useRef(null);
	const lastZ = useRef(null);

	const shakeCount = useRef(0);
	const timer = useRef(null);

	const lastTime = useRef(Date.now());
	const lastTriggerTime = useRef(0);

	const savedOnShake = useRef(onShake);
	useEffect(() => {
		savedOnShake.current = onShake;
	}, [onShake]);

	useEffect(() => {
		Accelerometer.setUpdateInterval(100);

		const subscription = Accelerometer.addListener((data) => {
			const { x, y, z } = data;
			const now = Date.now();

			if (now - lastTriggerTime.current < coolDownMs) {
				lastX.current = x;
				lastY.current = y;
				lastZ.current = z;
				return;
			}

			if (lastX.current !== null) {
				const deltaX = Math.abs(x - lastX.current);
				const deltaY = Math.abs(y - lastY.current);
				const deltaZ = Math.abs(z - lastZ.current);

				const totalDelta = deltaX + deltaY + deltaZ;

				if (totalDelta > sensitivity && now - lastTime.current > 100) {
					lastTime.current = now;
					shakeCount.current += 1;

					if (timer.current) clearTimeout(timer.current);
					timer.current = setTimeout(() => {
						shakeCount.current = 0;
					}, timeout);

					//Increase if the shake happens to quickly
					if (shakeCount.current >= 3) {
						if (timer.current) clearTimeout(timer.current);
						shakeCount.current = 0;
						lastTriggerTime.current = Date.now();

						Vibration.vibrate(500);

						if (savedOnShake.current) {
							savedOnShake.current();
						}
					}
				}
			}

			lastX.current = x;
			lastY.current = y;
			lastZ.current = z;
		});

		return () => {
			subscription.remove();
			if (timer.current) clearTimeout(timer.current);
		};
	}, [sensitivity, timeout, coolDownMs]);
}
