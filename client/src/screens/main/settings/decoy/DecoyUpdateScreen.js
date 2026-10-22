import React, { useCallback, useState } from "react";
import {
	View,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { DECOY_FORM_FIELDS } from "@constants/DecoyFields";
import { CustomInput } from "@components/forms/CustomInput";
import { useFormHandler } from "@hooks/useFormHandler";
import MainLayout from "@components/layouts/MainLayout";
import { validateDecoyForm } from "@utils/securityAndValidation/validationUtil";
import { useAuth } from "@context/AuthContext";
import { updateDecoyConfiguration } from "@services/main/decoyService";
import { getStoredPins } from "@utils/storage/secureStore";

// Inner form component that mounts only after pins are successfully loaded
const DecoyUpdateForm = ({ storedPins, navigation, user }) => {
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

	const initialValues = {
		decoyPin: storedPins.decoyPin || "",
		emergencyPin: storedPins.emergencyPin || "",
	};

	const { formData, errors, setErrors, handleChange, handleFieldBlur } =
		useFormHandler(initialValues);

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	const handleUpdate = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } = validateDecoyForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const currentUserId = user?.userId;

		if (!currentUserId) {
			setBanner({
				message: "A user session is required to update a decoy configuration",
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

			const result = await updateDecoyConfiguration(
				currentUserId,
				decoyPayload,
			);

			if (!result?.success) {
				setBanner({
					message: result?.error || "Failed to update decoy configuration",
					type: "error",
				});
				return;
			}

			setBanner({
				message:
					"Decoy configuration has successfully been updated for your device",
				type: "success",
			});

			setTimeout(() => navigation.goBack(), 800);
		} catch (error) {
			setBanner({
				message:
					error.message ||
					"There was an error updating your decoy configuration. Please try again",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		const currentDecoyPin = (formData.decoyPin || "").trim();
		const currentEmergencyPin = (formData.emergencyPin || "").trim();

		const initialDecoyPin = initialValues.decoyPin.trim();
		const initialEmergencyPin = initialValues.emergencyPin.trim();

		const isFormDirty =
			currentDecoyPin !== initialDecoyPin ||
			currentEmergencyPin !== initialEmergencyPin;

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
			title="Update Decoy Configuration"
			onBack={handleBack}
			tab="Settings"
			navigation={navigation}
			banner={banner}
			actionButton={{
				label: loading ? "Updating..." : "Update Decoy Configuration",
				icon: "save-outline",
				onPress: handleUpdate,
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

// Main Screen Wrapper handling asynchronous secure storage loading
const DecoyUpdateScreen = () => {
	const navigation = useNavigation();
	const { user } = useAuth();
	const [storedPins, setStoredPins] = useState(null);
	const [loadError, setLoadError] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	const loadDecoyData = useCallback(async () => {
		setIsLoading(true);
		setLoadError(null);
		try {
			const pins = await getStoredPins();
			setStoredPins(pins);
		} catch (error) {
			console.error("Failed to load decoy settings", error);
			setLoadError("Decoy PIN settings could not be read from secure storage.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadDecoyData();
		}, [loadDecoyData]),
	);

	if (isLoading || loadError || !storedPins) {
		return (
			<MainLayout
				title="Update Decoy Configuration"
				onBack={() => navigation.goBack()}
				tab="Settings"
				navigation={navigation}
				banner={loadError ? { message: loadError, type: "error" } : null}
				actionButton={
					loadError
						? {
								label: "Retry",
								onPress: loadDecoyData,
							}
						: undefined
				}
			>
				<View style={styles.loaderContainer}>
					{isLoading ? (
						<ActivityIndicator size="large" color="#6B21A8" />
					) : null}
				</View>
			</MainLayout>
		);
	}

	return (
		<DecoyUpdateForm
			key={`${storedPins.decoyPin || ""}:${storedPins.emergencyPin || ""}`}
			storedPins={storedPins}
			navigation={navigation}
			user={user}
		/>
	);
};

const styles = StyleSheet.create({
	scroll: {
		paddingBottom: 30,
	},
	loaderContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});

export default DecoyUpdateScreen;
