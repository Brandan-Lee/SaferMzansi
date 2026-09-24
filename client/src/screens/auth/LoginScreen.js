import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { validateLoginForm } from "../../utils/ValidationUtil";
import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { LOGIN_FORM_FIELDS } from "../../constants/AuthFields";

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

			//Token has been found in the local hardware
			if (result?.token) {
				//User logged in offline
				if (result.isOffline) {
					setBanner({
						message:
							"Logged in locally (offline). Your data will be synched once online",
						type: "warning",
					});
					//User logged in online
				} else {
					setBanner({
						message: "Login successful! Redirecting...",
						type: "success",
					});
				}

				//Navigate to home screen after a delay
				const redirectDelay = result.isOffline ? 1200 : 800;

				setTimeout(() => {
					navigation.navigate("HomeScreen");
				}, redirectDelay);
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
		<AuthScreenLayout
			title="Welcome Back"
			subtitle="Sign in to access your SaferMzansi account"
			banner={banner}
			navQuestion="Don't have an account"
			navActionText="Register"
			onNavPress={() => navigation.navigate("RegistrationScreen")}
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
		</AuthScreenLayout>
	);
};

const PURPLE = "#6B21A8";
const PURPLE_DARK = "#581C87";

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
	},
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 28,
		paddingTop: 48,
		paddingBottom: 32,
	},
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
	registerRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 20,
		marginBottom: 32,
	},
	registerText: {
		fontSize: 14,
		color: "#6B7280",
	},
	registerLink: {
		fontSize: 14,
		color: PURPLE,
		fontWeight: "700",
	},
	footerText: {
		fontSize: 12,
		color: PURPLE_DARK,
		textAlign: "center",
		fontWeight: "600",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},
	modalCard: {
		width: "100%",
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 24,
		alignItems: "center",
	},
	modalIconBadge: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#DCFCE7",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 8,
	},
	modalMessage: {
		fontSize: 14,
		color: "#4B5563",
		textAlign: "center",
		marginBottom: 20,
	},
});

export default LoginScreen;
