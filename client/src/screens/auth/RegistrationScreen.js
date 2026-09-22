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

const RegistrationScreen = () => {
	const [formData, setFormData] = useState({
		name: "",
		surName: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
	});

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
					<Text style={styles.logo}>SaferMzansi</Text>
					<Text style={styles.title}>Create Account</Text>
					<Text style={styles.subtitle}>
						Please fill in the form to create an account.
					</Text>
					<Text style={styles.label}>Name</Text>
					<TextInput
						style={styles.input}
						placeholder="John Wayde"
						placeholderTextColor="#6B7280"
						value={formData.name}
						onChangeText={(value) => handleChange("name", value)}
					/>
					<Text style={styles.label}>Surname</Text>
					<TextInput
						style={styles.input}
						placeholder="charles"
						placeholderTextColor="#6B7280"
						value={formData.surName}
						onChangeText={(value) => handleChange("surName", value)}
					/>
					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.input}
						placeholder="johnCharles@example.com"
						placeholderTextColor="#6B7280"
						keyboardType="email-address"
						value={formData.email}
						onChangeText={(value) => handleChange("email", value)}
					/>
					<Text style={styles.label}>Phone</Text>
					<TextInput
						style={styles.input}
						placeholder="+27 63 345 6789"
						placeholderTextColor="#6B7280"
						keyboardType="phone-pad"
						value={formData.phone}
						onChangeText={(value) => handleChange("phone", value)}
					/>
					<Text style={styles.label}>Password</Text>
					<TextInput
						style={styles.input}
						placeholder="••••••••"
						placeholderTextColor="#000000"
						secureTextEntry
						value={formData.password}
						onChangeText={(value) => handleChange("password", value)}
					/>
					<Text style={styles.label}>Confirm Password</Text>
					<TextInput
						style={styles.input}
						placeholder="••••••••"
						placeholderTextColor="#000000"
						secureTextEntry
						value={formData.confirmPassword}
						onChangeText={(value) => handleChange("confirmPassword", value)}
					/>
					<Pressable style={styles.registerButton} onPress={handleRegister}>
						<Text style={styles.registerButtonText}>Register</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#E5E7EB",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	text: {
		fontSize: 18,
		fontWeight: "500",
		color: "#000000",
	},
	logo: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 10,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		textAlign: "center",
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 5,
	},
	input: {
		width: "100%",
		height: 40,
		borderWidth: 1,
		borderColor: "#6B7280",
		borderRadius: 5,
		padding: 10,
		marginBottom: 15,
	},
	registerButton: {
		backgroundColor: "#3B82F6",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		marginTop: 10,
	},
	registerButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});
export default RegistrationScreen;
