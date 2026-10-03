import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useNetStatus } from "../../utils/NetStatus";
import Feather from "@expo/vector-icons/Feather";
import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { validateRegistrationForm } from "../../utils/ValidationUtil";
import { useFormHandler } from "../../hooks/UseFormHandler";
import { AuthScreenLayout } from "../../components/auth/AuthScreenLayout";
import { REGISTRATION_FORM_FIELDS } from "../../constants/AuthFields";
import { sendOtpEmail } from "../../services/auth/EmailService";
import { checkNetworkAndNotify } from "../../utils/NetworkGuard";
import PasswordStrengthMeter from "../../components/common/PasswordStrengthMeter";

const INITIAL_STATE = {
	name: "",
	surname: "",
	email: "",
	phone: "",
	password: "",
	confirmPassword: "",
};

const RegistrationScreen = () => {
	const navigation = useNavigation();
	const { isOnline } = useNetStatus();
	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);
	const [banner, setBanner] = useState(null);
	const [agreed, setAgreed] = useState(false);
	const [loading, setIsLoading] = useState(false);
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);

	//Method that helps to handle when the user agrees to the terms and conditions
	const handleToggleAgreed = () => {
		setAgreed((prev) => {
			const next = !prev;

			if (next && errors.agreed) {
				setErrors((errs) => ({
					...errs,
					agreed: "",
				}));
			}

			return next;
		});
	};

	const handleRegister = async () => {
		setBanner(null);

		//Validate if the form is valid or not
		const { isValid, errors: validationErrors } = validateRegistrationForm(
			formData,
			agreed,
		);

		//Form is not valid
		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		//The user was not online when registering
		if (!checkNetworkAndNotify(isOnline, setBanner)) {
			return;
		}
		setIsLoading(true);

		try {
			const sanitizedEmail = formData.email.trim().toLowerCase();
			const otpResponse = await sendOtpEmail(sanitizedEmail);

			if (!otpResponse?.success) {
				setBanner({
					message:
						otpResponse?.error ||
						"Failed to send a verification code. Please try again.",
					type: "error",
				});
				return;
			}

			setBanner({
				message: "Sending verification code...",
				type: "success",
			});

			setTimeout(() => {
				navigation.navigate("OTPScreen", {
					email: sanitizedEmail,
					isRegistration: true,
					pendingUserData: {
						name: formData.name,
						surname: formData.surname,
						email: sanitizedEmail,
						phoneNum: formData.phone,
						password: formData.password,
					},
				});
			}, 800);
			
		} catch (error) {
			setBanner({
				message:
					error.message || "An unexpected error occurred. Please try again.",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthScreenLayout
			title="Create Account"
			subtitle="Join SaferMzansi and take control of your safety"
			banner={banner}
			navQuestion="Already have an account? "
			navActionText="Login"
			onNavPress={() => navigation.replace("LoginScreen")}
		>
			{REGISTRATION_FORM_FIELDS.map((field) => (
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

			{/* Terms and Conditions Checkbox */}
			<TouchableOpacity
				style={styles.checkboxRow}
				onPress={handleToggleAgreed}
				activeOpacity={0.8}
			>
				<View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
					{agreed && <Feather name="check" size={12} color="#FFFFFF" />}
				</View>
				<Text style={styles.checkboxLabel}>
					I agree to the{" "}
					<Text
						style={styles.link}
						onPress={() => {
							navigation.navigate("TOSScreen");
						}}
					>
						Terms of Service
					</Text>{" "}
					and{" "}
					<Text
						style={styles.link}
						onPress={() => {
							navigation.navigate("PrivacyPolicyScreen");
						}}
					>
						Privacy Policy
					</Text>
				</Text>
			</TouchableOpacity>
			{/* Inline Client Validation Error for Checkbox */}
			{Boolean(errors.agreed) && (
				<Text style={styles.checkboxErrorText}>{errors.agreed}</Text>
			)}
			{/* Action Button */}
			<PrimaryButton
				title="REGISTER"
				onPress={handleRegister}
				loading={loading}
			/>
		</AuthScreenLayout>
	);
};

const PURPLE = "#6B21A8";

const styles = StyleSheet.create({
	checkboxRow: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		marginVertical: 14,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1.5,
		borderColor: PURPLE,
		borderRadius: 6,
		marginRight: 12,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},
	checkboxChecked: {
		backgroundColor: PURPLE,
	},
	checkboxLabel: {
		flex: 1,
		fontSize: 13,
		color: "#374151",
		flexWrap: "wrap",
		lineHeight: 18,
	},
	checkboxErrorText: {
		color: "#DC2626",
		fontSize: 12,
		marginTop: -4,
		marginBottom: 12,
		alignSelf: "flex-start",
	},
	link: {
		color: PURPLE,
		fontWeight: "700",
	},
});

export default RegistrationScreen;
