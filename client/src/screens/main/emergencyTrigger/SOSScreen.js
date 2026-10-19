import React, { useState, useRef, useEffect, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Animated,
	Easing,
	Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";
import { useLocation } from "@hooks/useLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	AudioModule,
	RecordingPresets,
	setAudioModeAsync,
	useAudioRecorder,
} from "expo-audio";
import {
	executeEmergencyDispatch,
	fetchEmergencyTimerConfig,
	finalizeEmergencyOnCancel,
} from "@services/main/emergencyService";

const PURPLE = "#5E0A9E";
const RED = "#EF4444";
const BACKGROUND = "#FFF5F5";
const TITLE = "#1F2937";
const BODY = "#6B7280";
const DEFAULT_TESTING_DURATION = 5;
const AUTO_RECORD_KEY = "@setting_auto_record";

const formatTime = (totalSeconds) => {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function SOSScreen({
	route,
	navigation,
	onCancel,
	onTimerEnd,
	onClose,
	duration,
}) {
	const isTesting = route?.params?.isTesting ?? false;
	const passedDuration = route?.params?.duration ?? duration;

	const [secondsLeft, setSecondsLeft] = useState(
		isTesting ? DEFAULT_TESTING_DURATION : 15,
	);
	const [isLoadingTimer, setIsLoadingTimer] = useState(true);
	const [alertSent, setAlertSent] = useState(false);
	const [isDispatching, setIsDispatching] = useState(false);
	const [dispatchError, setDispatchError] = useState(null);
	const [dispatchWarning, setDispatchWarning] = useState(null);
	const [isTestingComplete, setIsTestingComplete] = useState(false);
	const [smsPrepared, setSmsPrepared] = useState(false);
	const [emergencyDialerOpened, setEmergencyDialerOpened] = useState(false);
	const [isFinalizing, setIsFinalizing] = useState(false);
	const [incidentId, setIncidentId] = useState(null);
	const [recordingWarning, setRecordingWarning] = useState(null);

	const pulse = useRef(new Animated.Value(1)).current;
	const intervalRef = useRef(null);
	const dispatchStartedRef = useRef(false);
	const recordingUriRef = useRef(null);
	const recordingStartedRef = useRef(false);
	const screenActiveRef = useRef(true);
	const finalizationCompleteRef = useRef(false);
	const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
	const db = useSQLiteContext();
	const { user } = useAuth();
	const { getLocation } = useLocation();

	const stopEmergencyRecording = useCallback(async () => {
		if (!recordingStartedRef.current) return recordingUriRef.current;

		recordingStartedRef.current = false;
		await audioRecorder.stop();
		recordingUriRef.current = audioRecorder.uri || null;
		return recordingUriRef.current;
	}, [audioRecorder]);

	useEffect(() => {
		screenActiveRef.current = true;
		if (isTesting) return undefined;

		const startAutoRecording = async () => {
			if ((await AsyncStorage.getItem(AUTO_RECORD_KEY)) !== "true") return;

			let permission = await AudioModule.getRecordingPermissionsAsync();
			if (permission.status !== "granted") {
				permission = await AudioModule.requestRecordingPermissionsAsync();
			}
			if (permission.status !== "granted") {
				setRecordingWarning(
					"Automatic recording is off because microphone permission was not granted.",
				);
				return;
			}

			await setAudioModeAsync({
				allowsRecording: true,
				playsInSilentMode: true,
			});
			await audioRecorder.prepareToRecordAsync();
			if (!screenActiveRef.current) {
				return;
			}
			audioRecorder.record();
			recordingStartedRef.current = true;
		};

		startAutoRecording().catch((error) => {
			console.error("[Emergency SOS] Failed to start automatic recording:", error);
			setRecordingWarning(
				"Automatic recording could not start. Your SOS alert will still be sent.",
			);
		});

		return () => {
			screenActiveRef.current = false;
			if (recordingStartedRef.current) {
				recordingStartedRef.current = false;
				audioRecorder.stop().catch((error) => {
					console.warn("[Emergency SOS] Failed to stop recording:", error);
				});
			}
		};
	}, [audioRecorder, isTesting]);

	const handleTimerExpired = useCallback(async () => {
		if (dispatchStartedRef.current) return;
		dispatchStartedRef.current = true;

		if (isTesting) {
			setIsTestingComplete(true);
			return;
		}

		if (!db || !user?.userId) {
			setDispatchError(
				"Your session is unavailable. Please log in and try again.",
			);
			return;
		}

		setIsDispatching(true);
		Vibration.vibrate([0, 300, 150, 300]);
		try {
			const result = await executeEmergencyDispatch(
				db,
				user.userId,
				getLocation,
			);
			if (result?.incidentId) setIncidentId(result.incidentId);
			if (!result?.success) {
				setDispatchError(
					result?.error || "The emergency alert could not be dispatched.",
				);
				return;
			}

			if (result.smsOpened) {
				setSmsPrepared(true);
				return;
			}
			if (result.emergencyDialerOpened) {
				setEmergencyDialerOpened(true);
				return;
			}

			const warnings = [];
			if (!result.localSaved) warnings.push("local device storage");
			if (!result.incidentSaved) warnings.push("server incident storage");
			if (!result.locationSaved) warnings.push("server location storage");
			if (result.emailsFailed > 0) {
				warnings.push(`${result.emailsFailed} email delivery attempt(s)`);
			}
			if (result.contactsWithoutEmail > 0) {
				warnings.push(`${result.contactsWithoutEmail} contact(s) without an email`);
			}
			if (warnings.length > 0) {
				setDispatchWarning(
					`Alert email sent, but ${warnings.join(" and ")} failed. Check the app connection and server logs.`,
				);
			}
			setAlertSent(true);
			if (onTimerEnd) onTimerEnd();
		} catch (error) {
			console.error("Emergency dispatch failed:", error);
			setDispatchError(
				error.message || "The emergency alert could not be dispatched.",
			);
		} finally {
			setIsDispatching(false);
		}
	}, [db, getLocation, isTesting, onTimerEnd, user?.userId]);

	// Load timer duration dynamically on mount
	useEffect(() => {
		const loadTimerDuration = async () => {
			try {
				if (isTesting) {
					setSecondsLeft(DEFAULT_TESTING_DURATION);
				} else if (passedDuration) {
					setSecondsLeft(passedDuration);
				} else {
					const savedTimer = await fetchEmergencyTimerConfig();
					const parsedTimer = savedTimer ? parseInt(savedTimer, 10) : 15;
					const finalTimer = isNaN(parsedTimer) ? 15 : parsedTimer;
					setSecondsLeft(finalTimer);
				}
			} catch (error) {
				console.error("Failed to load timer duration on SOS screen:", error);
				setSecondsLeft(15);
			} finally {
				setIsLoadingTimer(false);
			}
		};

		loadTimerDuration();
	}, [isTesting, passedDuration]);

	// Start the countdown timer once loading completes
	useEffect(() => {
		if (isLoadingTimer) return;

		const endTime = Date.now() + secondsLeft * 1000;
		Vibration.vibrate(400);

		intervalRef.current = setInterval(() => {
			const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
			setSecondsLeft(remaining);

			if (remaining === 0) {
				clearInterval(intervalRef.current);
				handleTimerExpired();
			}
		}, 250);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [handleTimerExpired, isLoadingTimer]);

	// Alarm icon pulsing while timer is running
	useEffect(() => {
		if (alertSent) {
			pulse.setValue(1);
			return;
		}
		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, {
					toValue: 1.5,
					duration: 500,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
				Animated.timing(pulse, {
					toValue: 1,
					duration: 500,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: true,
				}),
			]),
		);
		animation.start();
		return () => animation.stop();
	}, [alertSent]);

	const handleCancel = async () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		Vibration.cancel();
		try {
			await stopEmergencyRecording();
		} catch (error) {
			console.warn("[Emergency SOS] Failed to stop recording on cancel:", error);
		}
		if (onCancel) onCancel();
		else if (navigation?.canGoBack()) navigation.goBack();
	};

	const handleClose = async () => {
		if (isFinalizing) return;
		if (incidentId && !isTesting && !finalizationCompleteRef.current) {
			setIsFinalizing(true);
			try {
				await stopEmergencyRecording();
				const result = await finalizeEmergencyOnCancel(
					db,
					incidentId,
					user?.userId,
					recordingUriRef.current,
					"COMPLETED",
				);
				if (!result.success) {
					setDispatchWarning(
						result.error || "Emergency evidence could not be saved.",
					);
					return;
				}
				finalizationCompleteRef.current = true;
				if (result.warning) {
					setDispatchWarning(result.warning);
					return;
				}
			} catch (error) {
				setDispatchWarning(error.message || "Emergency evidence could not be saved.");
				return;
			} finally {
				setIsFinalizing(false);
			}
		} else {
			try {
				await stopEmergencyRecording();
			} catch (error) {
				console.warn("[Emergency SOS] Failed to stop recording:", error);
			}
		}
		if (onClose) onClose();
		else if (onCancel) onCancel();
		else if (navigation?.canGoBack()) navigation.goBack();
	};

	return (
		<LinearGradient colors={["#D9D9D9", "#DCCBF3"]} style={styles.container}>
			<SafeAreaView style={styles.safe}>
				<View style={styles.inner}>
					<View style={styles.content}>
						<Animated.View style={{ transform: [{ scale: pulse }] }}>
							<MaterialCommunityIcons
								name="alarm-light"
								size={64}
								color={RED}
							/>
						</Animated.View>

						<Text style={styles.title}>
							{isTesting ? "Emergency SOS (Testing)" : "Emergency SOS"}
						</Text>

						{isTestingComplete ? (
							<>
								<Text style={styles.message}>SOS preview complete.</Text>
								<Text style={styles.subMessage}>
									This was a test. No emergency alert was sent.
								</Text>
							</>
						) : emergencyDialerOpened ? (
							<>
								<Text style={styles.message}>Emergency dialer opened.</Text>
								<Text style={styles.subMessage}>
									No saved emergency contacts were available. Complete the call
									from your phone&apos;s dialer.
								</Text>
							</>
						) : smsPrepared ? (
							<>
								<Text style={styles.message}>SMS message prepared.</Text>
								<Text style={styles.subMessage}>
									Your messaging app is open with the emergency details. Tap
									Send there to notify your contact.
								</Text>
							</>
						) : alertSent ? (
							<>
								<Text style={styles.message}>
									Your emergency alert has been sent.
								</Text>
								<Text style={styles.subMessage}>
									Your emergency contacts have been notified and your location
									has been shared.
								</Text>
								{dispatchWarning ? (
									<Text style={styles.subMessage}>{dispatchWarning}</Text>
								) : null}
								{recordingWarning ? (
									<Text style={styles.subMessage}>{recordingWarning}</Text>
								) : null}
							</>
						) : dispatchError ? (
							<>
								<Text style={styles.message}>
									We couldn&apos;t confirm that your alert was sent.
								</Text>
								<Text style={styles.subMessage}>{dispatchError}</Text>
							</>
						) : (
							<>
								<Text style={styles.message}>
									{isDispatching
										? "Sending your emergency alert..."
										: "You have activated the emergency alert."}
								</Text>
								<Text style={styles.subMessage}>
									{isDispatching
										? "Please wait while we contact your emergency contacts."
										: "Your emergency contacts will be notified and your location will be shared."}
								</Text>
							</>
						)}

						<View style={styles.card}>
							<View style={styles.cardItem}>
								<Ionicons name="location-outline" size={22} color={TITLE} />
								<Text style={styles.cardText}>Share current location</Text>
							</View>

							<View style={styles.cardItem}>
								<MaterialCommunityIcons
									name="bell-alert-outline"
									size={24}
									color={TITLE}
								/>
								<Text style={styles.cardText}>Notify emergency contacts</Text>
							</View>

							<View style={[styles.cardItem, styles.timerItem]}>
								<MaterialCommunityIcons
									name="shield-alert-outline"
									size={22}
									color={TITLE}
								/>
								<View
									style={[styles.timerBox, alertSent && styles.timerBoxSent]}
								>
									{alertSent ||
									isTestingComplete ||
									smsPrepared ||
									emergencyDialerOpened ? (
										<Ionicons name="checkmark" size={24} color={BACKGROUND} />
									) : dispatchError ? (
										<Ionicons
											name="alert-circle-outline"
											size={24}
											color={RED}
										/>
									) : (
										<Text
											style={[
												styles.timerText,
												secondsLeft <= 5 && styles.timerUrgent,
											]}
										>
											{formatTime(secondsLeft)}
										</Text>
									)}
								</View>
							</View>
						</View>
					</View>

					{alertSent ||
					dispatchError ||
					isTestingComplete ||
					smsPrepared ||
					emergencyDialerOpened ? (
						<TouchableOpacity
							style={styles.button}
							activeOpacity={0.8}
							onPress={handleClose}
							disabled={isFinalizing}
						>
							<Ionicons
								name="checkmark-circle-outline"
								size={24}
								color={BACKGROUND}
							/>
							<Text style={styles.buttonText}>
								{isFinalizing ? "Saving evidence..." : "Close"}
							</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							style={styles.button}
							activeOpacity={0.8}
							onPress={handleCancel}
							disabled={isDispatching}
						>
							{isDispatching ? (
								<Text style={styles.buttonText}>Sending alert...</Text>
							) : (
								<>
									<Ionicons
										name="close-circle-outline"
										size={24}
										color={BACKGROUND}
									/>
									<Text style={styles.buttonText}>Cancel</Text>
								</>
							)}
						</TouchableOpacity>
					)}
				</View>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: BACKGROUND,
		paddingHorizontal: 32,
	},
	safe: {
		flex: 1,
	},
	inner: {
		flex: 1,
		paddingHorizontal: 32,
	},
	content: {
		flex: 1,
		alignItems: "center",
		paddingTop: 70,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: TITLE,
		marginTop: 16,
		marginBottom: 32,
	},
	message: {
		fontSize: 15,
		color: BODY,
		textAlign: "center",
		marginBottom: 32,
	},
	subMessage: {
		fontSize: 15,
		color: BODY,
		lineHeight: 22,
		alignSelf: "stretch",
		marginBottom: 60,
	},
	card: {
		backgroundColor: "#FFFFFF",
		flexDirection: "row",
		alignSelf: "stretch",
		borderWidth: 1,
		borderColor: "#CDBBE0",
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 14,
		gap: 10,
	},
	cardItem: {
		flex: 1,
		alignItems: "center",
		gap: 8,
	},
	cardText: {
		fontSize: 14,
		color: TITLE,
		lineHeight: 20,
		alignSelf: "flex-start",
	},
	timerItem: {
		justifyContent: "flex-start",
	},
	timerBox: {
		backgroundColor: "#D9D9D9",
		paddingVertical: 10,
		paddingHorizontal: 12,
		minWidth: 80,
		alignItems: "center",
		marginTop: 8,
	},
	timerBoxSent: {
		backgroundColor: "#2E7D32",
	},
	timerText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111",
		fontVariant: ["tabular-nums"],
	},
	timerUrgent: {
		color: RED,
	},
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: PURPLE,
		borderRadius: 10,
		paddingVertical: 12,
		marginHorizontal: 16,
		marginBottom: 32,
		gap: 10,
	},
	buttonText: {
		color: "#FFF",
		fontSize: 17,
		fontWeight: "600",
	},
});
