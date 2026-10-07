import { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	KeyboardAvoidingView,
	ScrollView,
	Platform,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CustomInput } from "@components/forms/CustomInput";
import { useFormHandler } from "@hooks/useFormHandler";
import { CONTACT_FORM_FIELDS } from "@constants/ContactFields";
import { addEmergencyContact } from "@services/main/contactService";
import { useSQLiteContext } from "expo-sqlite";
import { validateAddContactForm } from "@utils/securityAndValidation/validationUtil";
import { useAuth } from "@context/AuthContext";
import MainLayout from "@components/layouts/MainLayout";

const PURPLE = "#5E0A9E";

const INITIAL_STATE = {
	name: "",
	surname: "",
	phone: "",
	email: "",
};

const AddContactScreen = ({ navigation }) => {
	const db = useSQLiteContext();
	const { user } = useAuth();

	const [loading, setIsLoading] = useState(false);
	const [banner, setBanner] = useState(null);
	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);

	const handleSave = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } =
			validateAddContactForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const currentUserId = user?.userId;
		if (!currentUserId) {
			setBanner({
				message:
					"A user session is required to add an emergency contact. Please log in again.",
				type: "error",
			});
			return;
		}

		setIsLoading(true);

		try {
			// const fullName = `${formData.name.trim()} ${formData.surname.trim()}`;
			const contactPayload = {
				firstName: formData.name.trim(),
				surname: formData.surname.trim(),
				phone: formData.phone,
				email: formData.email,
			};

			const result = await addEmergencyContact(db, currentUserId, contactPayload);

			if (!result?.success) {
				setBanner({
					message: result?.error || "Failed to save contact.",
					type: "error",
				});
				return;
			}

			setBanner({
				message: `Saved! ${formData.name, formData.surname} was added to your emergency contacts.`,
				type: "success",
			});

			setTimeout(() => {
				navigation.replace("EmergencyContactsScreen");
			}, 800);
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"There was an error creating the contact. Please try again.",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		// Updated to use formData.name instead of formData.firstName
		if (
			formData.name ||
			formData.surname ||
			formData.phone ||
			formData.email
		) {
			Alert.alert("Discard contact?", "Your changes will be lost.", [
				{ text: "Keep editing", style: "cancel" },
				{
					text: "Discard",
					style: "destructive",
					onPress: () => navigation.goBack(),
				},
			]);
		} else {
			navigation.goBack();
		}
	};

	const initials = [formData.name.trim(), formData.surname.trim()]
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join("");

	return (
		<MainLayout
			title="Add contact"
			onBack={handleBack}
			banner={banner}
			tab="Contacts"
			navigation={navigation}
			actionButton={{
				label: "Save Contact",
				icon: "person-add-outline",
				onPress: handleSave,
				loading: loading,
			}}
		>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.avatarFrame}>
						<View style={styles.avatar}>
							{initials ? (
								<Text style={styles.initials}>{initials}</Text>
							) : (
								<Ionicons name="person-outline" size={52} color={PURPLE} />
							)}
						</View>
					</View>

					{CONTACT_FORM_FIELDS.map((field) => (
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
				</ScrollView>
			</KeyboardAvoidingView>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	scroll: { paddingBottom: 20 },
	avatarFrame: {
		alignSelf: "center",
		padding: 2,
		marginBottom: 12,
	},
	avatar: {
		width: 68,
		height: 68,
		borderRadius: 34,
		backgroundColor: "#EFE3FA",
		alignItems: "center",
		justifyContent: "center",
	},
	initials: { fontSize: 26, fontWeight: "700", color: PURPLE },
});

export default AddContactScreen;