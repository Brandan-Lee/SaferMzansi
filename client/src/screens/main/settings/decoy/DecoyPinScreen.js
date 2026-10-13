import { react, useState } from "react";
import {
	View,
	Text,
	Pressable,
	StyleSheet,
	TextInput,
	Alert,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppHeader } from "@components/common/AppHeader";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { DECOY_FORM_FIELDS } from "@constants/DecoyFields";
import { CustomInput } from "@components/forms/CustomInput";
import { useFormHandler } from "@hooks/useFormHandler";
import MainLayout from "@components/layouts/MainLayout";

const INITIAL_STATE = {
	decoyPin: "",
	emergencyPin: "",
};

const DecoyPinScreen = () => {
	const navigation = useNavigation();
	const [pin, setPin] = useState("");
	const [emergencyPin, setEmergencyPin] = useState("");
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

	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	const handleCreatePin = () => {
		if (pin.length !== 4 || emergencyPin.length !== 4) {
			Alert.alert("Error", "Please enter a valid 4-digit PIN for both fields.");
			return;
		}

		if (pin === emergencyPin) {
			Alert.alert("Error", "Decoy PIN and Emergency PIN cannot be the same.");
			return;
		}

		Alert.alert(
			"Success",
			"Decoy PIN and Emergency PIN have been set successfully.",
			[
				{
					text: "OK",
					onPress: () => navigation.goBack(),
				},
			],
		);
	};

	const handleAdd = async () => {
		console.log("Adding configuration");
	};

	const handleBack = () => {
		const isFormDirty =
			formData.decoyPin.trim() || formData.emergencyPin.trim();

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
					navigation.replace("SettingsScreen", {
						userId: user.userId,
					});
				},
			});
		} else {
			navigation.replace("SettingsScreen", { userId: user.userId });
		}
	};

	return (
		<MainLayout
			title="Decoy Configuration"
			onBack={() => navigation.replace("SettingsScreen")}
			tab="Settings"
			navigation={navigation}
			banner={banner}
			actionButton={{
				label: loading ? "Adding..." : "Add Decoy Configuration",
				icon: "add-outline",
				onPress: handleAdd,
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
					showsVerticalScrollIndicator={false}
				>
					{/* App header title and subtitle */}
					<AppHeader subtitle={"Create a pin for your decoy account"} />

					{DECOY_FORM_FIELDS.map((field) => (
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
		alignItems: "center",
		marginHorizontal: 20,
		justifyContent: "center",
		backgroundColor: "#FAF7FF",
	},
	logoBadge: {
		width: 56,
		height: 56,
		borderRadius: 16,
		backgroundColor: "#6B21A8",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	logoBadgeHeart: { position: "absolute" },
	logoText: {
		fontSize: 24,
		fontWeight: "800",
		color: "#6B21A8",
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1F2937",
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		marginBottom: 24,
	},
	label: {
		width: "80%",
		fontSize: 16,
		color: "#1F2937",
		marginBottom: 8,
	},
	input: {
		width: "80%",
		height: 48,
		borderColor: "#d1d5db",
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		marginBottom: 20,
	},
	button: {
		backgroundColor: "#6B21A8",
		paddingVertical: 14,
		alignItems: "center",
		borderRadius: 8,
		marginTop: 8,
		width: "80%",
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "600",
	},
});

export default DecoyPinScreen;
