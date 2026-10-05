import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { validateLoginForm } from "@utils/securityAndValidation/validationUtil";
import { CustomInput } from "@components/forms/CustomInput";
import { PrimaryButton } from "@components/forms/PrimaryButton";
import { useFormHandler } from "@hooks/useFormHandler";
import { MainLayout } from "@components/layouts/MainLayout";
import { LOGIN_FORM_FIELDS } from "@constants/AuthFields";

const INITIAL_STATE = {
	email: "",
	password: "",
};

const LoginScreen = () => {
	const { login, loading } = useAuth();
	const navigation = useNavigation();
	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);
	const [banner, setBanner] = useState(null);

	//Method that handles login operations
	const handleLogin = async () => {
		setBanner(null);

		//Validate if the form is valid or not
		const { isValid, errors: validationErrors } = validateLoginForm(formData);

		//Form is not valid
		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		try {
			//Login through authContext
			const result = await login({
				email: formData.email.trim().toLowerCase(),
				password: formData.password,
			});

			console.log("login result", result);

			//Token has been found in the local hardware
			if (result?.token) {
				//User logged in offline
				const isOffline = result.isOffline;
				setBanner({
					message: isOffline
						? "Logged in locally (offline). Your data will sync once online."
						: "Login successful! Redirecting...",
					type: isOffline ? "warning" : "success",
				});

				// Navigate to the home screen
				setTimeout(
					() => {
						navigation.replace("HomeScreen", { userName: result.userName, userId: result.userId });
					},
					isOffline ? 1200 : 800,
				);
			} else {
				setBanner({
					message:
						result?.serverError ||
						"User logged in, but failed to sync with the server",
					type: "error",
				});
			}
		} catch (error) {
			setBanner({
				message:
					error.message || "An unexpected error occurred. Please try again.",
				type: "error",
			});
		}
	};

	return (
		<MainLayout
			title="Welcome Back"
			subtitle="Sign in to access your SaferMzansi account"
			banner={banner}
			navQuestion="Don't have an account"
			navActionText="Register"
			onNavPress={() => navigation.navigate("RegistrationScreen")}
			scrollable={false}
		>
			{LOGIN_FORM_FIELDS.map((field) => (
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

			{/* Forgot Password Link */}
			<TouchableOpacity
				style={styles.forgotPasswordWrapper}
				onPress={() => navigation?.navigate("ForgotPasswordScreen")}
				activeOpacity={0.7}
			>
				<Text style={styles.forgotPasswordText}>Forgot Password?</Text>
			</TouchableOpacity>

			{/* Action Button */}
			<PrimaryButton title="LOGIN" onPress={handleLogin} loading={loading} />
		</MainLayout>
	);
};

const PURPLE = "#6B21A8";

const styles = StyleSheet.create({
	forgotPasswordWrapper: {
		alignSelf: "flex-end",
		marginTop: 4,
		marginBottom: 24,
	},
	forgotPasswordText: {
		color: PURPLE,
		fontSize: 14,
		fontWeight: "600",
	},
});

export default LoginScreen;
