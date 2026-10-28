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
import {
	executeEmergencyDispatch,
	fetchEmergencyTimerConfig,
} from "@services/main/emergencyService";
import { finalizeEmergencyOnCancel } from "@services/main/emergencyFinalizationService";
import { useEmergencyRecording } from "@hooks/useEmergencyRecording";

const PURPLE = "#6B21A8";
const RED = "#EF4444";
const BACKGROUND = "#FFF5F5";
const TITLE = "#1F2937";
const BODY = "#6B7280";
const DEFAULT_TESTING_DURATION = 5;
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
	const { isRecording, warning: recordingWarning, stopRecording } =
		useEmergencyRecording(isTesting);

	const pulse = useRef(new Animated.Value(1)).current;
	const intervalRef = useRef(null);
	const dispatchStartedRef = useRef(false);
	const finalizationCompleteRef = useRef(false);
	const db = useSQLiteContext();
	const { user } = useAuth();
	const { getLocation } = useLocation();

	const handleTimerExpired = useCallback(async () => {
		if (dispatchStartedRef.current) return;
		dispatchStartedRef.current = true;

		if (isTesting) {
			setIsTestingComplete(true);
			return;
		}

		if (!db) {
			setDispatchError(
				"Emergency services are unavailable because local storage could not be opened.",
			);
			return;
		}

		setIsDispatching(true);
		Vibration.vibrate([0, 300, 150, 300]);
		try {
			const result = await executeEmergencyDispatch(
				db,
				user?.userId || null,
				getLocation,
				route?.params?.initialLocation,
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
	}, [db, getLocation, isTesting, onTimerEnd, route?.params?.initialLocation, user?.userId]);

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
			await stopRecording();
		} catch (error) {
			console.warn("[Emergency SOS] Failed to stop recording on cancel:", error);
		}
		if (onCancel) await onCancel();
		else if (onClose) await onClose();
		else if (navigation?.canGoBack()) navigation.goBack();
	};

	const handleClose = async () => {
		if (isFinalizing) return;
		if (!isTesting && !finalizationCompleteRef.current) {
			setIsFinalizing(true);
			try {
				const audioUri = await stopRecording();
				const result = await finalizeEmergencyOnCancel(
					db,
					incidentId,
					user?.userId,
					audioUri,
					"COMPLETED",
				);
				if (!result.success) {
					setDispatchWarning(
						result.error || "Emergency evidence could not be saved.",
					);
					return;
				}
				if (result.evidenceRequired && !result.evidenceSaved) {
					setDispatchWarning(
						result.warning || "Emergency evidence could not be saved. Please try again.",
					);
					return;
				}
				finalizationCompleteRef.current = true;
				if (result.warning) {
					setDispatchWarning(result.warning);
				}
			} catch (error) {
				setDispatchWarning(error.message || "Emergency evidence could not be saved.");
				return;
			} finally {
				setIsFinalizing(false);
			}
		} else {
			try {
				await stopRecording();
			} catch (error) {
				console.warn("[Emergency SOS] Failed to stop recording:", error);
			}
		}
		if (onClose) await onClose();
		else if (onCancel) await onCancel();
		else if (navigation?.canGoBack()) navigation.goBack();
	};

	return (
		<LinearGradient colors={["#FAF7FF", "#EDE4F7"]} style={styles.container}>
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
							{isRecording ? (
								<View style={styles.recordingStatus}>
									<Ionicons name="mic" size={19} color={RED} />
									<Text style={styles.recordingText}>
										Audio recording is active
									</Text>
								</View>
							) : null}
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
							style={[styles.button, styles.primaryButton]}
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
							style={[styles.button, styles.dangerButton]}
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
		paddingTop: 28,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: TITLE,
		marginTop: 16,
		marginBottom: 18,
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
		marginBottom: 20,
	},
	card: {
		backgroundColor: "#FFFFFF",
		flexDirection: "column",
		alignSelf: "stretch",
		borderWidth: 1,
		borderColor: "#CDBBE0",
		borderRadius: 14,
		paddingVertical: 18,
		paddingHorizontal: 14,
		gap: 16,
	},
	cardItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	cardText: {
		fontSize: 14,
		color: TITLE,
		lineHeight: 20,
	},
	recordingStatus: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3D1D1",
	},
	recordingText: { color: RED, fontSize: 14, fontWeight: "700" },
	timerItem: {
		justifyContent: "space-between",
	},
	timerBox: {
		backgroundColor: "#D9D9D9",
		paddingVertical: 10,
		paddingHorizontal: 12,
		minWidth: 80,
		alignItems: "center",
		marginTop: 0,
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
		borderRadius: 10,
		minHeight: 54,
		paddingVertical: 12,
		marginHorizontal: 16,
		marginBottom: 32,
		gap: 10,
	},
	primaryButton: { backgroundColor: PURPLE },
	dangerButton: { backgroundColor: "#B42318" },
	buttonText: {
		color: "#FFF",
		fontSize: 17,
		fontWeight: "600",
	},
});
