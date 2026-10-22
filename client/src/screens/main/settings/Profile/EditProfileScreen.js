import React, { useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	ScrollView,
	Platform,
	KeyboardAvoidingView,
} from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";
import { USER_FORM_FIELDS } from "@constants/UserFields";
import MainLayout from "@components/layouts/MainLayout";
import { CustomInput } from "@components/forms/CustomInput";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { useFormHandler } from "@hooks/useFormHandler";
import { validateUserForm } from "@utils/securityAndValidation/validationUtil";
import { updateUser } from "@services/main/userService";
const PURPLE = "#6B21A8";

const EditProfileScreen = ({ navigation, route }) => {
	const db = useSQLiteContext();
	const [loading, setIsLoading] = useState(false);
	const [banner, setBanner] = useState(null);
	const [modalConfig, setModalConfig] = useState({
		visible: false,
		title: "",
		message: "",
		confirmLabel: "Confirm",
		cancelLabel: "Cancel",
		isDestructive: false,
		iconName: "alert-circle-outline",
		onConfirm: () => {},
	});
	const userDetails = route?.params?.userDetails || null;
	const { user } = useAuth();

	const INITIAL_STATE = {
		name: userDetails?.firstName || userDetails?.name || "",
		surname: userDetails?.surname || "",
		phone: userDetails?.userNumber || "",
		email: userDetails?.email || "",
	};

	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	const handleSave = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } = validateUserForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const userId = user?.userId || user?.user_id;

		setIsLoading(true);

		try {
			const userPayload = {
				firstName: formData.name ? formData.name.trim() : "",
				surname: formData.surname ? formData.surname.trim() : "",
				phone: formData.phone ? formData.phone.trim() : "",
				email: formData.email ? formData.email.trim() : "",
			};

			const result = await updateUser(db, userId, userPayload, userDetails);

			if (!result?.success) {
				setBanner({
					message: result?.error || "Failed to update user.",
					type: "error",
				});
				return;
			}

			setBanner({
				message: `User Profile has been successfully updated.`,
				type: "success",
			});

			setTimeout(() => {
				navigation.navigate("ProfileScreen", {
					userDetails,
				});
			}, 800);
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"There was an error updating the user profile. Please try again.",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		// Normalize values to safely compare strings even if null/undefined
		const currentName = (formData.name || "").trim();
		const currentSurname = (formData.surname || "").trim();
		const currentPhone = (formData.phone || "").trim();
		const currentEmail = (formData.email || "").trim();

		const initialName = (INITIAL_STATE.name || "").trim();
		const initialSurname = (INITIAL_STATE.surname || "").trim();
		const initialPhone = (INITIAL_STATE.phone || "").trim();
		const initialEmail = (INITIAL_STATE.email || "").trim();

		const isFormDirty =
			currentName !== initialName ||
			currentSurname !== initialSurname ||
			currentPhone !== initialPhone ||
			currentEmail !== initialEmail;

		if (isFormDirty) {
			setModalConfig({
				visible: true,
				title: "Discard changes?",
				message:
					"You have unsaved changes. Are you sure you want to discard them?",
				confirmLabel: "Discard",
				cancelLabel: "Keep editing",
				isDestructive: true,
				iconName: "warning-outline",
				onConfirm: () => {
					hideModal();
					navigation.goBack();
				},
			});
		} else {
			navigation.goBack();
		}
	};

	const initials = [formData.name?.trim(), formData.surname?.trim()]
		.filter(Boolean)
		.map((w) => w[0].toUpperCase())
		.join("");

	return (
		<MainLayout
			title="Edit User Profile"
			onBack={handleBack}
			banner={banner}
			tab="Settings"
			navigation={navigation}
			actionButton={{
				label: loading ? "Updating..." : "Update User Profile",
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

					{USER_FORM_FIELDS.map((field) => (
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

			<ConfirmationModal
				visible={modalConfig.visible}
				title={modalConfig.title}
				message={modalConfig.message}
				confirmLabel={modalConfig.confirmLabel}
				cancelLabel={modalConfig.cancelLabel}
				isDestructive={modalConfig.isDestructive}
				iconName={modalConfig.iconName}
				onConfirm={modalConfig.onConfirm}
				onCancel={hideModal}
			/>
		</MainLayout>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#faf7ff",
	},
	content: {
		paddingHorizontal: 20,
		paddingBottom: 30,
		paddingTop: 15,
	},
	backBtnheader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
		height: 50,
	},
	backButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "flex-start",
	},
	headerTitle: {
		flex: 1,
		fontSize: 20,
		fontWeight: "700",
		color: "#1f2937",
		textAlign: "center",
	},
	header: {
		alignItems: "center",
		marginTop: 5,
		marginBottom: 25,
		width: "100%",
	},
	logoBadge: {
		width: 58,
		height: 58,
		borderRadius: 16,
		backgroundColor: "#6B21A8",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	logoText: {
		fontSize: 24,
		fontWeight: "800",
		color: "#6B21A8",
		marginBottom: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#1F2937",
		textAlign: "center",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		paddingHorizontal: 12,
		lineHeight: 20,
	},

	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 12,
		padding: 10,
		marginBottom: 12,
		paddingHorizontal: 12,
		fontSize: 14,
		color: "#1f2937",
		backgroundColor: "#f9f9f9",
		height: 52,
	},

	editButton: {
		backgroundColor: "#6a1b9a",
		padding: 10,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 20,
		shadowColor: "#6a1b9a",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 3,
		height: 50,
	},
	editButtonText: {
		color: "#FFFFFF",
		fontWeight: "700",
		fontSize: 16,
	},
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

export default EditProfileScreen;
