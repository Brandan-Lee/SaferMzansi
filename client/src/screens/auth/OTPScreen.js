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
import { useNetStatus } from "../../utils/NetStatus";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { sendOtpEmail, verifyOtpCode } from "../../services/auth/EmailService";
import { forgotPasswordUser } from "../../services/auth/UserService";
import { useSQLiteContext } from "expo-sqlite";
import { useOtp } from "../../hooks/UseOtp";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";
import { validateOtpInput } from "../../utils/ValidationUtil";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const OTP_LENGTH = 6;
const PURPLE = "#6B21A8";

const OTPScreen = ({ navigation, route }) => {
	const { otp, otpString, inputRefs, handleOtpChange, handleKeyPress } =
		useOtp(OTP_LENGTH);
	const [resending, setResending] = useState(false);
	const [banner, setBanner] = useState(null);
	const [timer, setTimer] = useState(60);
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

	// Timer countdown effect to avoid spamming the resend button
	useEffect(() => {
		if (timer <= 0) {
			return;
		}

		const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
		return () => clearInterval(interval);
	}, [timer]);

	// Send a request to the server to resend the OTP email.
	const handleResendCode = async () => {
		if (timer > 0 || resending || loading) {
			return;
		}

		// Pass state setter callback to network check
		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}

		setResending(true);
		setBanner(null);

		try {
			const response = isResetPassword
				? await forgotPasswordUser(db, sanitizedEmail)
				: await sendOtpEmail(sanitizedEmail);

			if (response?.error) {
				throw new Error(response.error);
			}

			setBanner({
				message: "A new OTP has been sent to your email.",
				type: "success",
			});
			setTimer(60);
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

	// Verifies the user's entered OTP
	const handleVerifyCode = async () => {
		setBanner(null);

		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}

		const otpError = validateOtpInput(otp, OTP_LENGTH);
		if (otpError) {
			setBanner({
				message: otpError,
				type: "error",
			});
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
						response?.error ||
						"There was a problem verifying your OTP code. Please try again.",
					type: "error",
				});
				return;
			}

			// Registration Flow
			if (isRegistration && pendingUserData) {
				const result = await register({
					name: pendingUserData.name,
					surname: pendingUserData.surname,
					email: sanitizedEmail,
					phoneNum: pendingUserData.phoneNum,
					password: pendingUserData.password,
				});

				if (result?.token) {
					setBanner({
						message:
							"Registration successful! Redirecting to login screen...",
						type: "success",
					});
				} else {
					setBanner({
						message:
							"Account created locally, but failed to sync with the server.",
						type: "error",
					});
				}

				setTimeout(() => {
					navigation.replace("LoginScreen");
				}, 800);
				return;
			}

			// Reset Password Flow
			if (isResetPassword) {
				setBanner({
					message:
						"OTP successfully verified. Redirecting to reset password screen...",
					type: "success",
				});

				setTimeout(() => {
					navigation.replace("ResetPasswordScreen", {
						email: sanitizedEmail,
						resetToken: response.data?.reset_token,
					});
				}, 800);
				return;
			}

			navigation.replace("LoginScreen");
		} catch (error) {
			setBanner({
				message: error.message || "Failed to verify OTP. Please try again.",
				type: "error",
			});
		} finally {
			setLoadingSpinner(false);
		}
	};

	return (
		<AuthScreenLayout
			title="Verify your account"
			subtitle={`Enter the OTP sent to ${sanitizedEmail || "your email"}`}
			banner={banner}
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
		</AuthScreenLayout>
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
