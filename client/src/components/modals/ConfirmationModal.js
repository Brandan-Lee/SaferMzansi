import React from "react";
import {
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	TouchableWithoutFeedback,
	ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlertBadge } from "@components/common/AlertBadge";

const PURPLE = "#5E0A9E";
const RED = "#D92D20";

const ConfirmationModal = ({
	visible,
	title = "Confirm Action",
	message = "Are you sure you want to proceed?",
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	isDestructive = false,
	iconName = "alert-circle-outline",
	loading = false,
	onConfirm,
	onCancel,
	banner,
}) => {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={loading ? undefined : onCancel}
		>
			<TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
				<View style={styles.overlay}>
					<TouchableWithoutFeedback>
						<View style={styles.modalCard}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: isDestructive ? "#FEE4E2" : "#EFE3FA" },
								]}
							>
								<Ionicons
									name={iconName}
									size={28}
									color={isDestructive ? RED : PURPLE}
								/>
							</View>

							<Text style={styles.title}>{title}</Text>
							<Text style={styles.message}>{message}</Text>

							{banner?.message ? (
								<View style={styles.bannerWrapper}>
									<AlertBadge message={banner.message} type={banner.type} />
								</View>
							) : null}

							<View style={styles.buttonRow}>
								<TouchableOpacity
									style={[
										styles.button,
										styles.cancelButton,
										loading && styles.disabledButton,
									]}
									onPress={onCancel}
									activeOpacity={0.7}
									disabled={loading} // 👈 Disable cancel during loading
								>
									<Text style={styles.cancelText}>{cancelLabel}</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.button,
										isDestructive
											? styles.destructiveButton
											: styles.confirmButton,
										loading && styles.disabledButton,
									]}
									onPress={onConfirm}
									activeOpacity={0.7}
									disabled={loading}
								>
									{loading ? (
										<ActivityIndicator size="small" color="#FFFFFF" />
									) : (
										<Text style={styles.confirmText}>{confirmLabel}</Text>
									)}
								</TouchableOpacity>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	modalCard: {
		width: "100%",
		maxWidth: 340,
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 5,
	},
	iconContainer: {
		width: 52,
		height: 52,
		borderRadius: 26,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1D2939",
		marginBottom: 6,
		textAlign: "center",
	},
	message: {
		fontSize: 14,
		color: "#667085",
		textAlign: "center",
		marginBottom: 16,
		lineHeight: 20,
	},
	bannerWrapper: {
		width: "100%",
		marginBottom: 16,
	},
	buttonRow: {
		flexDirection: "row",
		width: "100%",
		gap: 12,
	},
	button: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	cancelButton: {
		backgroundColor: "#F2F4F7",
	},
	confirmButton: {
		backgroundColor: PURPLE,
	},
	destructiveButton: {
		backgroundColor: RED,
	},
	disabledButton: {
		opacity: 0.6,
	},
	cancelText: {
		color: "#344054",
		fontWeight: "600",
		fontSize: 14,
	},
	confirmText: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 14,
	},
});

export default ConfirmationModal;
