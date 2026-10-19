import React, { useEffect, useState } from "react";
import {
	StyleSheet,
	Text,
	View,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	TouchableOpacity,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "@components/layouts/MainLayout";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import { CustomInput } from "@components/forms/CustomInput";
import { useFormHandler } from "@hooks/useFormHandler";
import { useAuth } from "@context/AuthContext";
import {
	fetchEmergencyTimerConfig,
	updateEmergencyTimerConfig,
} from "@services/main/emergencyService";
import { validateEmergencyTimerForm } from "@utils/securityAndValidation/validationUtil";

const EmergencyTimerConfigScreen = () => {
	const navigation = useNavigation();
	const { user } = useAuth();
	const [loading, setIsLoading] = useState(false);
	const [banner, setBanner] = useState(null);
	const [initialTimerValue, setInitialTimerValue] = useState("5");
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

	const {
		formData,
		errors,
		setErrors,
		handleChange,
		handleFieldBlur,
		setFormData,
	} = useFormHandler({ timerSeconds: "5" });

	const loadTimerData = async () => {
		try {
			const savedTimer = await fetchEmergencyTimerConfig();
			const timerStr =
				savedTimer !== null && savedTimer !== undefined
					? savedTimer.toString()
					: "5";
			setFormData({ timerSeconds: timerStr });
			setInitialTimerValue(timerStr);
		} catch (error) {
			console.error("Failed to load emergency timer configuration", error);
			setFormData({ timerSeconds: "5" });
		}
	};

	useEffect(() => {
		loadTimerData();
		const unsubscribe = navigation.addListener("focus", loadTimerData);
		return unsubscribe;
	}, [navigation]);

	const hideModal = () => {
		setModalConfig((prev) => ({ ...prev, visible: false }));
	};

	const handleSaveTimer = async () => {
		setBanner(null);

		const { isValid, errors: validationErrors } =
			validateEmergencyTimerForm(formData);

		if (!isValid) {
			setErrors(validationErrors);
			return;
		}

		const currentUserId = user?.userId;

		if (!currentUserId) {
			setBanner({
				message: "A user session is required to update emergency settings",
				type: "error",
			});
			return;
		}

		setIsLoading(true);

		try {
			const result = await updateEmergencyTimerConfig(
				currentUserId,
				formData.timerSeconds.trim(),
			);

			if (!result?.success) {
				setBanner({
					message: "Could not save settings. Please try again.",
					type: "error",
				});
				return;
			}

			setBanner({
				message: `Success! Emergency countdown window timer updated to ${result.timer} seconds`,
				type: "success",
			});

			setTimeout(() => navigation.goBack(), 800);
		} catch (error) {
			setBanner({
				message: error.message || "Could not save settings. Please try again.",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleBack = () => {
		const currentTimer = (formData.timerSeconds || "").trim();
		const isFormDirty = currentTimer !== initialTimerValue.trim();

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
			title="Emergency Timer"
			onBack={handleBack}
			tab="Settings"
			navigation={navigation}
			banner={banner}
			actionButton={{
				label: loading ? "Saving..." : "Save Emergency Timer",
				icon: "shield",
				onPress: handleSaveTimer,
				loading: loading,
			}}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* INFO CARD */}
					<View style={styles.card}>
						<View style={styles.cardHeader}>
							<MaterialCommunityIcons
								name="timer-sand"
								size={26}
								color="#DC2626"
							/>
							<Text style={styles.cardTitle}>Panic Window Duration</Text>
						</View>

						<View style={styles.descriptionContainer}>
							<View style={styles.descRow}>
								<Feather
									name="clock"
									size={16}
									color="#DC2626"
									style={styles.descIcon}
								/>
								<Text style={styles.descText}>
									<Text style={styles.descBold}>Countdown Grace Period: </Text>
									When a panic alert is triggered (via shake gesture or
									emergency PIN), this timer determines how many seconds you
									have to cancel a false alarm before your emergency alerts are
									automatically dispatched.
								</Text>
							</View>

							<View style={styles.descRow}>
								<Feather
									name="sliders"
									size={16}
									color="#6B21A8"
									style={styles.descIcon}
								/>
								<Text style={styles.descText}>
									<Text style={styles.descBold}>Recommended Setting: </Text>
									Set this between <Text style={styles.codeBadge}>
										5
									</Text> and <Text style={styles.codeBadge}>15</Text> seconds
									depending on how quickly you want your contacts notified.
								</Text>
							</View>
						</View>
					</View>

					{/* TIMER INPUT CONFIGURATION WITH CUSTOM INPUT */}
					<Text style={styles.sectionTitle}>Configuration</Text>
					<View style={styles.settingCard}>
						<View style={styles.settingTextContainer}>
							<Text style={styles.settingTitle}>
								Countdown Window (Seconds)
							</Text>
							<Text style={styles.settingSubtitle}>
								Allowed range: 3 to 30 seconds
							</Text>
						</View>
						<View style={styles.inputWrapper}>
							<CustomInput
								icon="clock"
								placeholder="5"
								value={formData.timerSeconds}
								onChangeText={(val) => handleChange("timerSeconds", val)}
								onBlur={() => handleFieldBlur("timerSeconds")}
								keyboardType="number-pad"
								maxLength={2}
								error={errors.timerSeconds}
							/>
						</View>
					</View>

					{/* PREVIEW SOS Screen */}
					<TouchableOpacity
						style={styles.previewButton}
						activeOpacity={0.8}
						onPress={() =>
							navigation.navigate("SOSScreen", { isTesting: true })
						}
					>
						<Feather name="shield" size={20} color="#FFFFFF" />
						<Text style={styles.previewButtonText}>Preview the SOS Screen</Text>
						<Feather name="chevron-right" size={18} color="#D8B4FE" />
					</TouchableOpacity>
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
	scrollView: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 32,
	},
	card: {
		backgroundColor: "#FEE2E2",
		borderRadius: 16,
		padding: 18,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: "#FECACA",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#DC2626",
		marginLeft: 10,
	},
	descriptionContainer: {
		marginTop: 4,
	},
	descRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	descIcon: {
		marginTop: 2,
		marginRight: 10,
	},
	descText: {
		flex: 1,
		fontSize: 13.5,
		color: "#4B5563",
		lineHeight: 20,
	},
	descBold: {
		fontWeight: "700",
		color: "#1F2937",
	},
	codeBadge: {
		fontWeight: "700",
		color: "#DC2626",
		backgroundColor: "#FEE2E2",
		overflow: "hidden",
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#374151",
		textTransform: "uppercase",
		letterSpacing: 0.6,
		marginTop: 8,
		marginBottom: 8,
	},
	settingCard: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginBottom: 24,
	},
	settingTextContainer: {
		flex: 1,
		marginRight: 12,
	},
	settingTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111827",
	},
	settingSubtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 3,
		lineHeight: 16,
	},
	inputWrapper: {
		width: 90,
	},
	previewButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#6B21A8",
		borderRadius: 14,
		paddingVertical: 15,
		paddingHorizontal: 16,
	},
	previewButtonText: {
		flex: 1,
		fontSize: 15,
		fontWeight: "600",
		color: "#FFFFFF",
		marginLeft: 10,
	},
});

export default EmergencyTimerConfigScreen;
