import React, { useState, useRef, useEffect } from "react";
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	ActivityIndicator,
	TouchableOpacity,
	Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetStatus } from "@utils/network/netStatus";
import { MainLayout } from "@components/layouts/AuthLayout";
import { PrimaryButton } from "@components/forms/PrimaryButton";
import { sendOtpEmail, verifyOtpCode } from "@services/auth/otpService";
import { forgotPasswordUser } from "@services/auth/authService";
import { useSQLiteContext } from "expo-sqlite";
import { useOtp } from "@hooks/useOtp";
import { checkNetworkAndNotify } from "@utils/network/networkGuard";
import { validateOtpInput } from "@utils/securityAndValidation/validationUtil";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@context/AuthContext";

const OTP_LENGTH = 6;
const PURPLE = "#6B21A8";

// Storage keys scoped to the email so users don't lock out different accounts
const getLockoutKey = (email) => `@otp_lockout_expiry_${email}`;
const getAttemptsKey = (email) => `@otp_resend_attempts_${email}`;

const OTPScreen = ({ navigation, route }) => {
	const { otp, otpString, inputRefs, handleOtpChange, handleKeyPress } =
		useOtp(OTP_LENGTH);
	const [resending, setResending] = useState(false);
	const [banner, setBanner] = useState(null);
	const [timer, setTimer] = useState(60);

	// In-memory counter & lockout expiry states
	const [resendAttempts, setResendAttempts] = useState(0);
	const [lockoutTimer, setLockoutTimer] = useState(0);

	const db = useSQLiteContext();
	const { isOnline } = useNetStatus();
	const userEmail = route?.params?.email || "";
	const isRegistration = route?.params?.isRegistration || false;
	const pendingUserData = route?.params?.pendingUserData || null;
	const isResetPassword = route?.params?.isResetPassword || false;
	const { register, loading } = useAuth();
	const [loadingSpinner, setLoadingSpinner] = useState(false);
	const rawEmail = isRegistration ? pendingUserData?.email : userEmail;

	const sanitizedEmail = String(rawEmail || "")
		.trim()
		.toLowerCase();

	// Check AsyncStorage on screen mount to restore attempts and active lockout
	useEffect(() => {
		let isMounted = true;

		const checkPersistedLockout = async () => {
			if (!sanitizedEmail) return;

			try {
				const [savedExpiry, savedAttempts] = await Promise.all([
					AsyncStorage.getItem(getLockoutKey(sanitizedEmail)),
					AsyncStorage.getItem(getAttemptsKey(sanitizedEmail)),
				]);

				if (!isMounted) return;

				const attempts = savedAttempts ? parseInt(savedAttempts, 10) : 0;
				setResendAttempts(attempts);

				if (savedExpiry) {
					const expiryTimestamp = parseInt(savedExpiry, 10);
					const remainingSeconds = Math.ceil(
						(expiryTimestamp - Date.now()) / 1000,
					);

					if (remainingSeconds > 0) {
						setLockoutTimer(remainingSeconds);
					} else {
						// Lockout expired while away — clean up storage
						await Promise.all([
							AsyncStorage.removeItem(getLockoutKey(sanitizedEmail)),
							AsyncStorage.removeItem(getAttemptsKey(sanitizedEmail)),
						]);
						setResendAttempts(0);
					}
				}
			} catch (error) {
				console.error("Failed to load OTP lockout state from storage:", error);
			}
		};

		checkPersistedLockout();

		return () => {
			isMounted = false;
		};
	}, [sanitizedEmail]);

	// // Send initial OTP email when navigating to the screen
	// useEffect(() => {
	// 	let isMounted = true;
	// 	const sendInitialEmail = async () => {
	// 		if (!sanitizedEmail) return;
	// 		try {
	// 			const response = isResetPassword
	// 				? await forgotPasswordUser(db, sanitizedEmail)
	// 				: await sendOtpEmail(sanitizedEmail);

	// 			if (response?.error && isMounted) {
	// 				setBanner({
	// 					message: response.error,
	// 					type: "error",
	// 				});
	// 			}
	// 		} catch (err) {
	// 			if (isMounted) {
	// 				setBanner({
	// 					message: err.message || "Failed to send OTP email.",
	// 					type: "error",
	// 				});
	// 			}
	// 		}
	// 	};

	// 	sendInitialEmail();
	// 	return () => {
	// 		isMounted = false;
	// 	};
	// }, []);

	// 60-second Resend button countdown timer
	useEffect(() => {
		if (timer <= 0) return;
		const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
		return () => clearInterval(interval);
	}, [timer]);

	// 5-minute Lockout countdown timer
	useEffect(() => {
		if (lockoutTimer <= 0) return;

		const interval = setInterval(() => {
			setLockoutTimer((prev) => {
				if (prev <= 1) {
					// Lockout ended — clear persistent storage
					AsyncStorage.multiRemove([
						getLockoutKey(sanitizedEmail),
						getAttemptsKey(sanitizedEmail),
					]).catch((err) =>
						console.error("Error clearing lockout storage:", err),
					);

					setResendAttempts(0);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [lockoutTimer, sanitizedEmail]);

	// Send a request to the server to resend the OTP email.
	const handleResendCode = async () => {
		if (
			timer > 0 ||
			resending ||
			loading ||
			resendAttempts >= 5 ||
			lockoutTimer > 0
		) {
			return;
		}

		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}

		setResending(true);
		setBanner(null);

		try {
			const response = isResetPassword
				? await forgotPasswordUser(sanitizedEmail)
				: await sendOtpEmail(sanitizedEmail);

			if (response?.error) {
				throw new Error(response.error);
			}

			setBanner({
				message: "A new OTP has been sent to your email.",
				type: "success",
			});
			setTimer(60);

			// Calculate new attempts and update state & AsyncStorage
			const newCount = resendAttempts + 1;
			setResendAttempts(newCount);
			await AsyncStorage.setItem(
				getAttemptsKey(sanitizedEmail),
				newCount.toString(),
			);

			// If maximum attempts hit, start 5-minute (300-second) lockout
			if (newCount >= 5) {
				const lockoutExpiryTimestamp = Date.now() + 5 * 60 * 1000;
				await AsyncStorage.setItem(
					getLockoutKey(sanitizedEmail),
					lockoutExpiryTimestamp.toString(),
				);
				setLockoutTimer(300);
			}
		} catch (error) {
			setBanner({
				message:
					error.message || "Failed to resend OTP. Please try again later.",
				type: "error",
			});
		} finally {
			setResending(false);
		}
	};

	// Format remaining lockout seconds into MM:SS
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
	};

	// Verifies the user's entered OTP
	const handleVerifyCode = async () => {
		setBanner(null);

		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}

		const otpError = validateOtpInput(otp, OTP_LENGTH);
		if (otpError) {
			setBanner({ message: otpError, type: "error" });
			return;
		}

		setLoadingSpinner(true);

		try {
			const response = await verifyOtpCode(
				db,
				sanitizedEmail,
				otpString,
				isResetPassword ? "password_reset" : "verification",
			);

			if (!response?.success) {
				setBanner({
					message:
						response?.error || "There was a problem verifying your OTP code.",
					type: "error",
				});
				return;
			}

			// Cleanup storage
			await AsyncStorage.multiRemove([
				getLockoutKey(sanitizedEmail),
				getAttemptsKey(sanitizedEmail),
			]).catch(() => {});

			// Registration Flow
			// OTPScreen_3.js

			if (isRegistration) {
				if (!pendingUserData) {
					setBanner({
						message: "Registration details are missing. Please try again.",
						type: "error",
					});
					return;
				}

				try {
					const result = await register({
						name: pendingUserData.name,
						surname: pendingUserData.surname,
						email: sanitizedEmail,
						phoneNum: pendingUserData.phoneNum,
						password: pendingUserData.password,
					});

					if (result?.token || result?.success) {
						setBanner({
							message: "Registration successful! Redirecting...",
							type: "success",
						});

						setTimeout(() => {
							navigation.navigate("LoginScreen");
						}, 800);
					} else {
						setBanner({
							message:
								result?.error || "Registration failed. Please try again.",
							type: "error",
						});
					}
				} catch (regError) {
					console.error("=== [ERROR IN REGISTER] ===", regError);
					setBanner({
						message: regError.message || "Failed to complete registration.",
						type: "error",
					});
				}
				return;
			}

			if (isResetPassword) {
				const resetToken = response.data?.reset_token;

				if (!resetToken) {
					setBanner({
						message:
							"OTP verified, but the password reset token was missing. Please request a new code.",
						type: "error",
					});
					return;
				}

				navigation.navigate("ResetPasswordScreen", {
					email: sanitizedEmail,
					resetToken,
				});
				return;
			}

			setBanner({
				message: "OTP verified successfully.",
				type: "success",
			});
		} catch (error) {
			console.error("=== [ERROR IN handleVerifyCode] ===", error);
			setBanner({
				message: error.message || "Failed to verify OTP. Please try again.",
				type: "error",
			});
		} finally {
			setLoadingSpinner(false);
		}
	};

	return (
		<MainLayout
			title="Verify your account"
			subtitle={`Enter the OTP sent to ${sanitizedEmail || "your email"}`}
			banner={banner}
			scrollable={false}
		>
			<View style={styles.otpContainer}>
				{otp.map((digit, index) => (
					<TextInput
						key={index}
						ref={(ref) => (inputRefs.current[index] = ref)}
						style={[styles.otpBox, digit !== "" && styles.filledOtpBox]}
						keyboardType="number-pad"
						maxLength={index === 0 ? 6 : 1}
						textAlign="center"
						value={digit}
						selectTextOnFocus
						onChangeText={(text) => handleOtpChange(text, index)}
						onKeyPress={(e) => handleKeyPress(e, index)}
					/>
				))}
			</View>

			<PrimaryButton
				title="VERIFY CODE"
				onPress={handleVerifyCode}
				loading={loading || loadingSpinner}
			/>

			{resendAttempts >= 5 || lockoutTimer > 0 ? (
				<Text style={styles.resendText}>
					You have reached the maximum number of resend attempts. Please try
					again in {formatTime(lockoutTimer)}.
				</Text>
			) : (
				<View style={styles.resendSection}>
					<Text style={styles.resendText}>Didn't receive the code? </Text>
					<TouchableOpacity
						onPress={handleResendCode}
						disabled={timer > 0 || resending || loading}
						activeOpacity={0.7}
						style={styles.resendPressable}
					>
						{resending ? (
							<ActivityIndicator color={PURPLE} size="small" />
						) : (
							<Text
								style={[
									styles.resendButtonText,
									(timer > 0 || loading) && styles.disabledResendText,
								]}
							>
								{timer > 0 ? `Resend in ${timer}s` : "Resend code"}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			)}

			<Pressable
				style={({ pressed }) => [
					styles.backButton,
					pressed && styles.backButtonPressed,
				]}
				onPress={() => navigation.goBack()}
				hitSlop={8}
			>
				<Feather
					name="arrow-left"
					size={16}
					color="#6B21A8"
					style={styles.backIcon}
				/>
				<Text style={styles.backButtonText}>Back</Text>
			</Pressable>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	otpContainer: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
		marginBottom: 24,
	},
	otpBox: {
		width: 44,
		height: 54,
		borderWidth: 1.5,
		borderColor: "#D1D5DB",
		borderRadius: 10,
		fontSize: 22,
		fontWeight: "700",
		color: "#111827",
		backgroundColor: "#FFFFFF",
		textAlign: "center",
		marginHorizontal: 2,
		elevation: 1,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	filledOtpBox: {
		borderColor: PURPLE,
		backgroundColor: "#F3E8FF",
		color: PURPLE,
	},
	resendSection: {
		alignItems: "center",
		marginTop: 28,
	},
	resendText: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
	},
	resendPressable: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginTop: 2,
	},
	resendButtonText: {
		color: PURPLE,
		fontSize: 15,
		fontWeight: "700",
	},
	disabledResendText: {
		color: "#9CA3AF",
	},
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "center",
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginTop: 16,
		borderRadius: 8,
	},
	backButtonPressed: {
		opacity: 0.6,
		backgroundColor: "rgba(107, 33, 168, 0.05)",
	},
	backIcon: {
		marginRight: 6,
	},
	backButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: PURPLE,
	},
});

export default OTPScreen;
