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
import { useSQLiteContext } from "expo-sqlite";
import { validateContactForm } from "@utils/securityAndValidation/validationUtil";
import { useAuth } from "@context/AuthContext";
import { updateEmergencyContact } from "@services/main/contactService";
import MainLayout from "@components/layouts/MainLayout";

const PURPLE = "#5E0A9E";

const EditContactScreen = ({ navigation, route }) => {
	const db = useSQLiteContext();
	const [loading, setIsLoading] = useState(false);
	const [banner, setBanner] = useState(null);
	const contact = route?.params?.contact || null;
	const { user } = useAuth();

	const INITIAL_STATE = {
		name: contact?.firstName || contact?.name || "",
		surname: contact?.surname || "",
		phone: contact?.phone || "",
		email: contact?.email || "",
	};

	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);

	const handleSave = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } = validateContactForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const contactId = contact?.contactId || contact?.contact_id;
		const userId = user?.id || user?.user_id || contact?.user_id;

		if (!contactId) {
			setBanner({
				message: "A contact must be selected from the Emergency Contacts Screen",
				type: "error",
			});
			return;
		}

		setIsLoading(true);

		try {
			const contactPayload = {
				firstName: formData.name ? formData.name.trim() : "",
				surname: formData.surname ? formData.surname.trim() : "",
				phone: formData.phone ? formData.phone.trim() : "",
				email: formData.email ? formData.email.trim() : "",
			};

			const result = await updateEmergencyContact(
				db,
				userId,
				contactId,
				contactPayload,
				contact,
			);

			if (!result?.success) {
				setBanner({
					message: result?.error || "Failed to update contact.",
					type: "error",
				});
				return;
			}

			const fullName = `${contactPayload.firstName} ${contactPayload.surname}`.trim();

			setBanner({
				message: `Saved! Contact ${fullName} was successfully updated.`,
				type: "success",
			});

			setTimeout(() => {
				navigation.replace("ContactDetailsScreen", {
					contact: {
						...contact,
						...contactPayload,
						contactId,
					},
				});
			}, 800);
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"There was an error updating the contact. Please try again.",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
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
			navigation.replace("ContactDetailsScreen");
		}
	};

	const initials = [formData.name?.trim(), formData.surname?.trim()]
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join("");

	return (
		<MainLayout
			title="Edit contact"
			onBack={handleBack}
			banner={banner}
			tab="Contacts"
			navigation={navigation}
			actionButton={{
				label: loading ? "Saving..." : "Save Contact",
				icon: "person-add-outline",
				onPress: handleSave,
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
						<View key={field.key}>
							<CustomInput
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
						</View>
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

export default EditContactScreen;