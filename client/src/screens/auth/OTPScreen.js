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
import { sendOtpEmail, verifyOtpCode } from "../../services/EmailService";
import { useSQLiteContext } from "expo-sqlite";
import { useOtp } from "../../hooks/UseOtp";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";
import { validateOtpInput } from "../../utils/ValidationUtil";
import { Feather } from "@expo/vector-icons";

const OTP_LENGTH = 6;
const PURPLE = "#6B21A8";

const OTPScreen = ({ navigation, route }) => {
	const { otp, otpString, inputRefs, handleOtpChange, handleKeyPress } =
		useOtp(OTP_LENGTH);
	const [loading, setLoading] = useState(false);
	const [resending, setResending] = useState(false);
	const [banner, setBanner] = useState(null);
	const [timer, setTimer] = useState(60);
	const db = useSQLiteContext();
	const { isOnline } = useNetStatus();
	const userEmail = route?.params?.email || "";

	// Timer countdown effect to avoid spamming the resend button
	useEffect(() => {
		if (timer <= 0) {
			return;
		}

		const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
		return () => clearInterval(interval);
	}, [timer]);

	//Send a request to the server to resend the OTP email. Disable the button for 60 seconds after sending.
	const handleResendCode = async () => {
		//Prevents the spamming of resend code to the server
		if (timer > 0 || resending || loading) {
			return;
		}

		//Check to see if the user is online or not
		if (!checkNetworkAndNotify(isOnline, banner)) {
			return;
		}

		//Set the resending state to true to show the loading indicator and prevent multiple requests
		setResending(true);
		// Clear any existing banners before sending the request
		setBanner(null);

		try {
			//Use Email Service to send the OTP email
			const response = await sendOtpEmail(userEmail);

			//There was a problem to resend the OTP
			if (response?.error) {
				throw new Error(response.error);
			}

			//OTP has been sent successfully
			setBanner({
				message: "A new OTP has been sent to your email.",
				type: "success",
			});
			// Reset the timer to 60 seconds after successfully resending the OTP
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

	//Verifys the user's entered OTP by sending it to the server. If successful, navigates to the login screen.
	const handleVerifyCode = async () => {
		//Check to see if the user is online or not
		if (!checkNetworkAndNotify(isOnline, banner)) {
			return;
		}

		//Checks to see if the user has entered all 6 digits of the OTP
		const otpError = validateOtpInput(otp, OTP_LENGTH);

		if (otpError) {
			setBanner({
				message: otpError,
				type: "error",
			});
			return;
		}

		//Shows a loading indicator while the verification request is being processed
		setLoading(true);
		//Clear any existing banners before sending the request
		setBanner(null);

		try {
			//Sends a POST request to the server with the user's email and entered OTP for verification
			const response = await verifyOtpCode(db, userEmail, otpString);
			setBanner({
				message: response.message || "OTP verified successfully.",
				type: "success",
			});

			//Redirect the user to the login screen
			setTimeout(() => {
				navigation.navigate("LoginScreen");
			}, 800);
		} catch (error) {
			setBanner({
				message: error.message || "Failed to verify OTP. Please try again.",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthScreenLayout
			title="Verify your account"
			subtitle={`Enter the OTP sent to ${userEmail || "your email"}`}
			banner={banner}
		>
			<View style={styles.otpContainer}>
				{otp.map((digit, index) => (
					<TextInput
						key={index}
						ref={(ref) => (inputRefs.current[index] = ref)}
						style={[styles.otpBox, digit !== "" && styles.filledOtpBox]}
						keyboardType="number-pad"
						maxLength={index === 0 ? 6 : 1} // Allows paste action on first box
						textAlign="center"
						value={digit}
						selectTextOnFocus
						onChangeText={(text) => handleOtpChange(text, index)}
						onKeyPress={(e) => handleKeyPress(e, index)}
					/>
				))}
			</View>

			{/* Action Button */}
			<PrimaryButton
				title="VERIFY CODE"
				onPress={handleVerifyCode}
				loading={loading}
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
