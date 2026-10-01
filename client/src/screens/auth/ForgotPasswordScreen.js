import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useNetStatus } from "../../utils/NetStatus";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";
import { validateForgotPasswordForm } from "../../utils/ValidationUtil";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { FORGOT_PASSWORD_FORM_FIELDS } from "../../constants/AuthFields";
import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { forgotPasswordUser } from "../../services/auth/UserService";
import { useSQLiteContext } from "expo-sqlite";

const INITIAL_STATE = {
	email: "",
};
const SUCCESS_MESSAGE = "We'll send an OTP to this email if the user exists.";

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
		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}

		setLoading(true);

		try {
			const sanitizedEmail = formData.email.trim().toLowerCase();

			await forgotPasswordUser(db, sanitizedEmail);
			setBanner({
				message: SUCCESS_MESSAGE,
				type: "success",
			});

			setTimeout(() => {
				navigation.navigate("OTPScreen", {
					email: sanitizedEmail,
					isResetPassword: true,
				});
			}, 800);
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
			<TouchableOpacity
				style={styles.backButton}
				onPress={() => {
					navigation.navigate("LoginScreen");
				}}
			>
				<Feather name="chevron-left" size={20} color="#6B21A8" />

				<Text style={styles.backText}>Back to Login</Text>
			</TouchableOpacity>
		</AuthScreenLayout>
	);
};

const styles = StyleSheet.create({
	backButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 24,
		marginBottom: 24,
	},

	backText: {
		color: "#6F20B8",
		fontSize: 16,
		fontWeight: "bold",
		marginLeft: 4,
	},
});

export default ForgotPasswordScreen;
