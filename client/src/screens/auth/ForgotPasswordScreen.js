import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useNetStatus } from "../../utils/NetStatus";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { API_BASE_URL } from "../../utils/config";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";
import { validateForgotPasswordForm } from "../../utils/ValidationUtil";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { FORGOT_PASSWORD_FORM_FIELDS } from "../../constants/AuthFields";
import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { Feather } from "@expo/vector-icons";
import { forgotPasswordUser } from "../../services/UserService";
import { sendOtpEmail } from "../../services/EmailService";
import { useSQLiteContext } from "expo-sqlite";

const INITIAL_STATE = {
	email: "",
};

const ForgotPasswordScreen = () => {
	const navigation = useNavigation();
	const { isOnline } = useNetStatus();
	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);
	const [banner, setBanner] = useState(null);
	const [loading, setLoading] = useState(false);
	const db = useSQLiteContext();

	const handleSendOTP = async () => {
		setBanner(null);

		//Validate if the form is valid or not
		const { isValid, errors: validationErrors } =
			validateForgotPasswordForm(formData);

		//Form is not valid
		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		// Check internet connectivity
		checkNetworkAndNotify(isOnline, banner);
		setLoading(true);

		try {
			const sanitizedEmail = formData.email.trim().toLowerCase();

			//Use user service to perform forgot password operations
			const result = await forgotPasswordUser(db, sanitizedEmail);

			if (result?.success) {
				//Use Email Service to send an otp to the users email
				const otpResponse = await sendOtpEmail(sanitizedEmail);

				//The OTP couldn't be sent
				if (otpResponse?.error) {
					setBanner({
						message:
							otpResponse?.error ||
							"Failed to send a verification code. Please request a new one on the next screen",
						type: "error",
					});
				} else {
					setBanner({
						message:
							"We'll send an OTP to this email if the user exists",
						type: "success",
					});
				}

				setTimeout(() => {
					navigation.navigate("OTPScreen", {
						email: sanitizedEmail,
						isResetPassword: true,
					});
				}, 800);
			} else {
				//Response failed, but for security purposes we need to still show a success message to prevent brute-force attacks
				setBanner({
					message: "We'll send an OTP to this email if the user exists",
					type: "success",
				});
				setTimeout(() => {
					navigation.navigate("OTPScreen", {
						email: sanitizedEmail,
						isResetPassword: true,
					});
				}, 800);
			}
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"An error occurred while sending the OTP. Please try again.",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleBackToLogin = () => {
		setTimeout(() => {
			navigation.navigate("LoginScreen");
		}, 800);
	};

	return (
		<AuthScreenLayout
			title="Forgot Password?"
			subtitle="Enter your email address and we'll send you a OTP to reset your password"
			banner={banner}
		>
			{FORGOT_PASSWORD_FORM_FIELDS.map((field) => (
				<CustomInput
					key={field.key}
					label={field.label}
					icon={field.icon}
					placeholder={field.placeholder}
					value={formData[field.key]}
					onChangeText={(val) => handleChange(field.key, val)}
					onBlur={() => handleFieldBlur(field.key)}
					secureTextEntry={field.secureTextEntry}
					keyboardType={field.keyboardType}
					autoCapitalize={field.autoCapitalize}
					error={errors[field.key]}
				/>
			))}

			<PrimaryButton
				title="SEND OTP"
				onPress={handleSendOTP}
				loading={loading}
			/>

			{/* Back to Login */}
			<TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
				<Feather name="chevron-left" size={20} color="#6B21A8" />

				<Text style={styles.backText}>Back to Login</Text>
			</TouchableOpacity>
		</AuthScreenLayout>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},

	content: {
		flex: 1,
		paddingHorizontal: 28,
		paddingTop: 10,
		alignItems: "center",
	},

	/* Logo */
	logoContainer: {
		alignItems: "center",
		marginBottom: 30,
	},

	logoIcon: {
		fontSize: 38,
		color: "#7B16D9",
		fontWeight: "bold",
	},

	logoText: {
		fontSize: 30,
		fontWeight: "bold",
		color: "#7B16D9",
	},

	/* Title */
	title: {
		fontSize: 36,
		fontWeight: "bold",
		color: "#171717",
		marginBottom: 15,
	},

	/* Description */
	description: {
		width: "100%",
		textAlign: "center",
		fontSize: 20,
		lineHeight: 30,
		color: "#777777",
		marginBottom: 30,
	},

	/* Status Banner */
	banner: {
		width: "100%",
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
	},
	bannerError: {
		backgroundColor: "#FEE2E2",
	},
	bannerSuccess: {
		backgroundColor: "#DCFCE7",
	},
	bannerText: {
		textAlign: "center",
		fontSize: 14,
		color: "#1F2937",
	},

	/* Email Input */
	input: {
		width: "100%",
		height: 70,
		backgroundColor: "#F7F5F8",
		borderWidth: 1,
		borderColor: "#ECE8EF",
		borderRadius: 14,
		paddingHorizontal: 20,
		paddingTop: 35,
	},

	logoBadge: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 4,
	},

	logo: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#6B21A8",
		marginBottom: 28,
	},

	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#111827",
		marginBottom: 12,
	},

	subtitle: {
		width: "100%",
		fontSize: 16,
		lineHeight: 24,
		textAlign: "center",
		color: "#374151",
		marginBottom: 28,
		paddingHorizontal: 10,
	},

	inputContainer: {
		width: "100%",
		height: 56,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 10,
		paddingHorizontal: 16,
	},

	inputIcon: {
		marginRight: 12,
	},

	input: {
		flex: 1,
		height: "100%",
		fontSize: 16,
		color: "#111827",
	},

	button: {
		width: "100%",
		height: 56,
		backgroundColor: "#6B21A8",
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		marginTop: 32,
	},

	buttonText: {
		color: "#FFFFFF",
		fontSize: 20,
		fontWeight: "bold",
	},

	backText: {
		color: "#6F20B8",
		fontSize: 16,
		fontWeight: "bold",
		marginTop: 30,
	},
});

export default ForgotPasswordScreen;
