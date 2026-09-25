import { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	Pressable,
	ScrollView,
	Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useNetStatus } from "../../utils/NetStatus";
import { Feather } from "@expo/vector-icons";
import { CustomInput } from "../../components/common/CustomInput";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { AlertBadge } from "../../components/common/AlertBadge";
import { validateField, validateForm } from "../../utils/ValidationUtil";
import { API_BASE_URL } from "../../utils/config";

const FORM_FIELDS = [
	{
		key: "name",
		label: "Name",
		icon: "user",
		placeholder: "John",
		autoCapitalize: "words",
	},
	{
		key: "surname",
		label: "Surname",
		icon: "user",
		placeholder: "Wayde",
		autoCapitalize: "words",
	},
	{
		key: "email",
		label: "Email",
		icon: "mail",
		placeholder: "john@example.com",
		keyboardType: "email-address",
		autoCapitalize: "none",
	},
	{
		key: "phone",
		label: "Phone",
		icon: "phone",
		placeholder: "+27 63 345 6789",
		keyboardType: "phone-pad",
	},
	{
		key: "password",
		label: "Password",
		icon: "lock",
		placeholder: "••••••••",
		secureTextEntry: true,
	},
	{
		key: "confirmPassword",
		label: "Confirm Password",
		icon: "lock",
		placeholder: "••••••••",
		secureTextEntry: true,
	},
];

const RegistrationScreen = () => {
	const { register, loading } = useAuth();
	const navigation = useNavigation();
	const { isOnline } = useNetStatus();

	const [formData, setFormData] = useState({
		name: "",
		surname: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});

	const [errors, setErrors] = useState({});
	const [banner, setBanner] = useState(null);
	const [agreed, setAgreed] = useState(false);
	const [successModalVisible, setSuccessModalVisible] = useState(false);

	const handleFieldBlur = (field) => {
		const errorMessage = validateField(field, formData[field], formData);
		setErrors((prev) => ({
			...prev,
			[field]: errorMessage,
		}));
	};

	const handleChange = (field, value) => {
		const updatedData = { ...formData, [field]: value };
		setFormData(updatedData);

		if (errors[field]) {
			const errorMessage = validateField(field, value, updatedData);
			setErrors((prev) => ({
				...prev,
				[field]: errorMessage,
			}));
		}
	};

	const handleToggleAgreed = () => {
		const nextAgreed = !agreed;
		setAgreed(nextAgreed);

		if (nextAgreed && errors.agreed) {
			setErrors((prev) => ({ ...prev, agreed: "" }));
		}
	};

	const handleRegister = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } = validateForm(
			formData,
			agreed,
		);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		if (!isOnline) {
			setBanner({
				message: "Internet Connection Required. Please connect to register.",
				type: "error",
			});
			return;
		}

		try {
			const result = await register({
				name: formData.name.trim(),
				surname: formData.surname.trim(),
				email: formData.email.trim().toLowerCase(),
				phoneNum: formData.phone.trim(),
				password: formData.password,
			});

			if (result?.token) {
				setSuccessModalVisible(true);

				//Once a successful registration occurs, send a request to the server to send the OTP email. The server will handle sending the email.
				const response = await fetch(`${API_BASE_URL}/send-otp-email`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
				});

				const data = await response.text();
				alert(data);


			} else {
				setBanner({
					message:
						"Account created locally, but failed to sync with the server.",
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

	const handleSuccessConfirm = () => {
		setSuccessModalVisible(false);
		//Navigate to the OTP verification screen, passing the user's email as a parameter for OTP verification. Also used if the user never received the OTP email and needs to request a new one.
		navigation.navigate("OTPScreen", { email: formData.email.trim().toLowerCase() });
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.content}>
					<View style={styles.logoBadge}>
						<Feather name="shield" size={40} color="#6B21A8" />
					</View>
					<Text style={styles.logo}>SaferMzansi</Text>
					<Text style={styles.title}>Create Account</Text>
					<Text style={styles.subtitle}>
						Join SaferMzansi and take control of your safety.
					</Text>

					{/* Banner displayed ONLY for API/Backend/Network states */}
					{banner && <AlertBadge message={banner.message} type={banner.type} />}

					{FORM_FIELDS.map((field) => (
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

					<Pressable style={styles.checkboxRow} onPress={handleToggleAgreed}>
						<View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
							{agreed && <Feather name="check" size={12} color="#FFFFFF" />}
						</View>
						<Text style={styles.checkboxLabel}>
							I agree to the <Text style={styles.link}>Terms of Service</Text>{" "}
							and <Text style={styles.link}>Privacy Policy</Text>
						</Text>
					</Pressable>

					{/* Inline Client Validation Error for Checkbox */}
					{errors.agreed && (
						<Text style={styles.checkboxErrorText}>{errors.agreed}</Text>
					)}

					<PrimaryButton
						title="REGISTER"
						onPress={handleRegister}
						loading={loading}
					/>

					<Text style={styles.loginRow}>
						Already have an account?{" "}
						<Text
							style={styles.loginLink}
							onPress={() => navigation.navigate("LoginScreen")}
						>
							Login
						</Text>
					</Text>
				</View>
			</ScrollView>

			{/* Custom Registration Success Modal */}
			<Modal
				transparent
				visible={successModalVisible}
				animationType="fade"
				onRequestClose={handleSuccessConfirm}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<View style={styles.modalIconBadge}>
							<Feather name="check-circle" size={32} color="#16A34A" />
						</View>
						<Text style={styles.modalTitle}>Registration Successful</Text>
						<Text style={styles.modalMessage}>
							Account created for {formData.name.trim()}. Please proceed to
							verify your OTP.
						</Text>
						<PrimaryButton title="CONTINUE" onPress={handleSuccessConfirm} />
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FAF7FF" },
	scrollContent: { paddingVertical: 20 },
	content: {
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
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
		marginBottom: 10,
		color: "#6B21A8",
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 10,
		color: "#111827",
	},
	subtitle: {
		fontSize: 16,
		textAlign: "center",
		marginBottom: 20,
		color: "#374151",
	},
	checkboxRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		width: "100%",
		marginVertical: 10,
	},
	checkbox: {
		width: 18,
		height: 18,
		borderWidth: 1.5,
		borderColor: "#6B21A8",
		borderRadius: 4,
		marginRight: 8,
		marginTop: 2,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxChecked: { backgroundColor: "#6B21A8" },
	checkboxLabel: { flex: 1, fontSize: 14, color: "#374151" },
	checkboxErrorText: {
		color: "#DC2626",
		fontSize: 12,
		marginTop: -4,
		marginBottom: 8,
		alignSelf: "flex-start",
		fontWeight: "500",
	},
	link: { color: "#6B21A8", fontWeight: "600" },
	loginRow: { marginTop: 16, fontSize: 14, color: "#374151" },
	loginLink: { color: "#6B21A8", fontWeight: "700" },

	// Modal Styles
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
		borderRadius: 16,
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
		fontWeight: "bold",
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

export default RegistrationScreen;
