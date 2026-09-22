import React, { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	Pressable,
	ScrollView,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const RegistrationScreen = () => {
	const [formData, setFormData] = useState({
		name: "",
		surName: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});
	const [agreed, setAgreed] = useState(false);

	const handleChange = (field, value) => {
		setFormData({
			...formData,
			[field]: value,
		});
	};

	const handleRegister = () => {
		if (
			!formData.name ||
			!formData.surName ||
			!formData.email ||
			!formData.phone ||
			!formData.password ||
			!formData.confirmPassword
		) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			Alert.alert("Error", "Passwords do not match.");
			return;
		}
		console.log("Registration data:", formData);
		Alert.alert(
			"Registration Successful",
			"You have been registered successfully!",
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.ScrollViewContent}
				showsVerticalScrollIndicator={false}
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

					<Text style={styles.label}>Name</Text>
					<View style={styles.inputWrapper}>
						<Feather name="user" size={18} color="#6B21A8" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="John Wayde"
							placeholderTextColor="#6B7280"
							value={formData.name}
							onChangeText={(value) => handleChange("name", value)}
						/>
					</View>

					<Text style={styles.label}>Surname</Text>
					<View style={styles.inputWrapper}>
						<Feather name="user" size={18} color="#6B21A8" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="charles"
							placeholderTextColor="#6B7280"
							value={formData.surName}
							onChangeText={(value) => handleChange("surName", value)}
						/>
					</View>

					<Text style={styles.label}>Email</Text>
					<View style={styles.inputWrapper}>
						<Feather name="mail" size={18} color="#6B21A8" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="johnCharles@example.com"
							placeholderTextColor="#6B7280"
							keyboardType="email-address"
							value={formData.email}
							onChangeText={(value) => handleChange("email", value)}
						/>
					</View>

					<Text style={styles.label}>Phone</Text>
					<View style={styles.inputWrapper}>
						<Feather name="phone" size={18} color="#6B21A8" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="+27 63 345 6789"
							placeholderTextColor="#6B7280"
							keyboardType="phone-pad"
							value={formData.phone}
							onChangeText={(value) => handleChange("phone", value)}
						/>
					</View>

					<Text style={styles.label}>Password</Text>
					<View style={styles.inputWrapper}>
						<Feather name="lock" size={18} color="#6B21A8" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="••••••••"
							placeholderTextColor="#000000"
							secureTextEntry
							value={formData.password}
							onChangeText={(value) => handleChange("password", value)}
						/>
					</View>

					<Text style={styles.label}>Confirm Password</Text>
					<View style={styles.inputWrapper}>
						<Feather name="lock" size={18} color="#6B21A8" style={styles.inputIcon} />
						<TextInput
							style={styles.input}
							placeholder="••••••••"
							placeholderTextColor="#000000"
							secureTextEntry
							value={formData.confirmPassword}
							onChangeText={(value) => handleChange("confirmPassword", value)}
						/>
					</View>

					<Pressable style={styles.checkboxRow} onPress={() => setAgreed(!agreed)}>
						<View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
							{agreed && <Feather name="check" size={12} color="#FFFFFF" />}
						</View>
						<Text style={styles.checkboxLabel}>
							I agree to the <Text style={styles.link}>Terms of Service</Text> and{" "}
							<Text style={styles.link}>Privacy Policy</Text>
						</Text>
					</Pressable>

					<Pressable style={styles.registerButton} onPress={handleRegister}>
						<Text style={styles.registerButtonText}>Register</Text>
					</Pressable>

					<Text style={styles.loginRow}>
						Already have an account? <Text style={styles.loginLink}>Login</Text>
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5E6FE",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
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
	label: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 5,
		alignSelf: "flex-start",
	},
	inputWrapper: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#6B7280",
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 15,
	},
	inputIcon: {
		marginRight: 8,
	},
	input: {
		flex: 1,
		height: 40,
		paddingVertical: 0,
	},
	checkboxRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		width: "100%",
		marginBottom: 15,
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
	checkboxChecked: {
		backgroundColor: "#6B21A8",
	},
	checkboxLabel: {
		flex: 1,
		fontSize: 14,
		color: "#374151",
	},
	link: {
		color: "#6B21A8",
		fontWeight: "600",
	},
	loginRow: {
		marginTop: 16,
		fontSize: 14,
		color: "#374151",
	},
	loginLink: {
		color: "#6B21A8",
		fontWeight: "700",
	},
	registerButton: {
		backgroundColor: "#6A1B9A",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		marginTop: 10,
		width: "100%",
		alignItems: "center",
	},
	registerButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});
export default RegistrationScreen;