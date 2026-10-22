import React, { useState } from "react";
import {
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { DECOY_FORM_FIELDS } from "@constants/DecoyFields";
import { CustomInput } from "@components/forms/CustomInput";
import { useFormHandler } from "@hooks/useFormHandler";
import MainLayout from "@components/layouts/MainLayout";
import { validateDecoyForm } from "@utils/securityAndValidation/validationUtil";
import { useAuth } from "@context/AuthContext";
import { addDecoyConfiguration } from "@services/main/decoyService";

const INITIAL_STATE = {
	decoyPin: "",
	emergencyPin: "",
};

const DecoyAddScreen = () => {
	const navigation = useNavigation();
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
	const { user } = useAuth();

	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(INITIAL_STATE);

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	const handleAdd = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } = validateDecoyForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const currentUserId = user?.userId;

		if (!currentUserId) {
			setBanner({
				message: "A user session is required to add a decoy configuration",
				type: "error",
			});

			return;
		}

		setIsLoading(true);

		try {
			const decoyPayload = {
				decoyPin: formData.decoyPin.trim(),
				emergencyPin: formData.emergencyPin.trim(),
			};

			const result = await addDecoyConfiguration(currentUserId, decoyPayload);

			if (!result?.success) {
				setBanner({
					message: result?.error || "Failed to save decoy configuration",
					type: "error",
				});
				return;
			}

			setBanner({
				message:
					"Decoy configuration has successfully been created for your device",
				type: "success",
			});

			setTimeout(() => navigation.goBack(), 800);
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"There was an error creating your decoy configuration. Please try again",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
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
					navigation.goBack();
				},
			});
		} else {
			navigation.goBack();
		}
	};

	return (
		<MainLayout
			title="Add Decoy Configuration"
			onBack={handleBack}
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
	scroll: {
		paddingBottom: 30,
	},
});

export default DecoyAddScreen;
