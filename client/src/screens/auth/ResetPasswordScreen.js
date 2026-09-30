import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { RESET_PASSWORD_FORM_FIELDS } from "../../constants/AuthFields";
import PasswordStrengthMeter from "../../components/common/PasswordStrengthMeter";
import { validateResetPasswordForm } from "../../utils/ValidationUtil";
import { useSQLiteContext } from "expo-sqlite";
import { resetPasswordUser } from "../../services/UserService";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";
import { useNetInfo } from "@react-native-community/netinfo";

const INITIAL_STATE = {
	password: "",
	confirmPassword: "",
};

const ResetPasswordScreen = ({ navigation, route }) => {
	const [loading, setLoading] = useState(false);
	const [banner, setBanner] = useState(null);
	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
	const db = useSQLiteContext();
	const email = route?.params?.email || "";

	const netInfo = useNetInfo();
	const isOnline = Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false);

	const handleResetPassword = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } =
			validateResetPasswordForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const isConnected = checkNetworkAndNotify(isOnline, setBanner);
		if (!isConnected) {
			return;
		}

		setLoading(true);

		try {
			const normalEmail = email.trim().toLowerCase();
			const result = await resetPasswordUser(
				db,
				formData.password,
				normalEmail,
			);

			if (!result?.success) {
				setBanner({
					message:
						result?.error ||
						"There was a problem updating your password. Please try again.",
					type: "error",
				});
				return;
			}

			setBanner({
				message: "Password reset successful! Redirecting...",
				type: "success",
			});

			setTimeout(() => {
				navigation.replace("LoginScreen");
			}, 800);
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"An error occurred while updating your password. Please try again.",
				type: "error",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleBackToLogin = () => {
		setTimeout(() => {
			navigation.replace("LoginScreen");
		}, 800);
	};

	return (
		<AuthScreenLayout
			title="Reset Password"
			subtitle="Create a new password for your account"
			banner={banner}
		>
			{RESET_PASSWORD_FORM_FIELDS.map((field) => (
				<View key={field.key}>
					<CustomInput
						label={field.label}
						icon={field.icon}
						placeholder={field.placeholder}
						value={formData[field.key]}
						onChangeText={(val) => handleChange(field.key, val)}
						onFocus={() => {
							if (field.key === "password") {
								setIsPasswordFocused(true);
							}
						}}
						onBlur={() => {
							if (field.key === "password") {
								setIsPasswordFocused(false);
							}
							handleFieldBlur(field.key);
						}}
						secureTextEntry={field.secureTextEntry}
						keyboardType={field.keyboardType}
						autoCapitalize={field.autoCapitalize}
						error={errors[field.key]}
					/>
					{field.key === "password" && isPasswordFocused && (
						<PasswordStrengthMeter password={formData.password} />
					)}
				</View>
			))}

			<PrimaryButton
				title="RESET PASSWORD"
				onPress={handleResetPassword}
				loading={loading}
			/>

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
		backgroundColor: "#FAF7FF",
	},
	scrollcontent: {
		flexGrow: 1,
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
		paddingVertical: 30,
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
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		color: "#374151",
		textAlign: "center",
		marginBottom: 28,
	},
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

export default ResetPasswordScreen;