import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	AudioModule,
	RecordingPresets,
	setAudioModeAsync,
	useAudioRecorder,
} from "expo-audio";
import { STORAGE_KEYS } from "@constants/storageKeys";

export const useEmergencyRecording = (isTesting) => {
	const [warning, setWarning] = useState(null);
	const [isRecording, setIsRecording] = useState(false);
	const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const recordingUri = useRef(null);
	// Refs let the cleanup stop audio even if React has not rendered the latest state yet.
	const recordingStarted = useRef(false);
	const screenActive = useRef(true);

	const stopRecording = useCallback(async () => {
		if (!recordingStarted.current) return recordingUri.current;

		recordingStarted.current = false;
		await recorder.stop();
		setIsRecording(false);
		recordingUri.current = recorder.uri || null;
		return recordingUri.current;
	}, [recorder]);

	useEffect(() => {
		screenActive.current = true;
		if (isTesting) return undefined;

		const startRecording = async () => {
			if (
				(await AsyncStorage.getItem(STORAGE_KEYS.AUTO_RECORDING)) !== "true"
			) {
				return;
			}

			const permission = await AudioModule.getRecordingPermissionsAsync();
			if (permission.status !== "granted") {
				setWarning(
					"Automatic recording is off because microphone permission was not granted.",
				);
				return;
			}

			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});
			await recorder.prepareToRecordAsync();
			if (!screenActive.current) return;

			recorder.record();
			recordingStarted.current = true;
			setIsRecording(true);
		};

		startRecording().catch((error) => {
			console.error("[Emergency SOS] Failed to start automatic recording:", error);
			setWarning(
				"Automatic recording could not start. Your SOS alert will still be sent.",
			);
		});

		return () => {
			screenActive.current = false;
			if (recordingStarted.current) {
				recordingStarted.current = false;
				recorder.stop().catch((error) => {
					console.warn("[Emergency SOS] Failed to stop recording:", error);
				});
			}
		};
	}, [isTesting, recorder]);

	return { isRecording, warning, stopRecording };
};
