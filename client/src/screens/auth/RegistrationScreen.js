import { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	TextInput,
	Pressable,
	ScrollView,
	Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useNetStatus } from "../../utils/NetStatus";

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

	const handleChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleRegister = async () => {

		//-----------------------------------------------------------  TESTING -----------------------------------------------------------
		if (!isOnline){
			Alert.alert("Internet Connection Required", "Please connect to the internet to register for an account. ")
			return;
		} else{
			console.log("There was internet.")
		}


		//Validation Checks
		if (
			!formData.name ||
			!formData.surname ||
			!formData.email ||
			!formData.phone ||
			!formData.password ||
			!formData.confirmPassword
		) {
			Alert.alert("Error", "Please fill in all fields.");
			return;
		}

		//Ensure that the password and confirm password match
		if (formData.password !== formData.confirmPassword) {
			Alert.alert("Error", "Passwords do not match.");
			return;
		}

		//Use user service to register the user
		try {
			const result = await register({
				name: formData.name,
				surname: formData.surname.trim(),
				email: formData.email.trim().toLowerCase(),
				phoneNum: formData.phone.trim(),
				password: formData.password,
			});

			if (result?.token) {
				Alert.alert(
					"Registration Successful",
					`User ${formData.name}'s account has been created and synced successfully.`,
					[
						{
							text: "OK",
							onPress: () => navigation.navigate("OTPScreen"),
						},
					],
				);
			} else {
				Alert.alert(
					"Registration Incomplete",
					"Your account was saved locally but could not be synced with the server. Please check your connection and try again.",
				);
			}
		} catch (error) {
			Alert.alert(
				"Registration Failed",
				error.message || "An unexpected error has occured. Please try again"
			);
		}
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
						value={formData.surname}
						onChangeText={(value) => handleChange("surname", value)}
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
