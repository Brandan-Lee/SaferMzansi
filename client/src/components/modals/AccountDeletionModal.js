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

const RED = "#D92D20";
const WARNING_ORANGE = "#B54708";

const AccountDeletionModal = ({
	visible,
	loading = false,
	onCancel,
	onSoftDelete,
	onHardDelete,
	banner,
	action = null,
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
							<View style={styles.iconContainer}>
								<Ionicons name="warning-outline" size={28} color={RED} />
							</View>

							<Text style={styles.title}>Delete Account</Text>
							<Text style={styles.subtitle}>
								Choose how you would like to remove your account from
								SaferMzansi.
							</Text>

							{banner?.message ? (
								<View style={styles.bannerWrapper}>
									<AlertBadge message={banner.message} type={banner.type} />
								</View>
							) : null}

							{/* Soft Delete Option Box */}
							<View style={styles.optionBox}>
								<Text style={styles.optionTitle}>Disable Account</Text>
								<Text style={styles.optionDescription}>
									Deactivates your account and hides your profile. Your records
									are retained for 30 days securely and can be restored if you
									log back in later before this timer has expired.
								</Text>
								<TouchableOpacity
									style={[
										styles.button,
										styles.softButton,
										loading && styles.disabledButton,
									]}
									onPress={onSoftDelete}
									disabled={loading}
									activeOpacity={0.7}
									accessibilityRole="button"
									accessibilityState={{
										busy: loading && action === "soft",
										disabled: loading,
									}}
								>
									{loading && action === "soft" ? (
										<ActivityIndicator size="small" color="#FFFFFF" />
									) : (
										<Text style={styles.softButtonText}>
											Disable User Account
										</Text>
									)}
								</TouchableOpacity>
							</View>

							{/* Hard Delete Option Box */}
							<View style={[styles.optionBox, styles.hardBox]}>
								<Text style={[styles.optionTitle, { color: RED }]}>
									Permanent Delete
								</Text>
								<Text style={styles.optionDescription}>
									Permanently deletes all your personal data, emergency
									contacts, and history from the database completely. This
									action cannot be undone.
								</Text>
								<TouchableOpacity
									style={[
										styles.button,
										styles.hardButton,
										loading && styles.disabledButton,
									]}
									onPress={onHardDelete}
									disabled={loading}
									activeOpacity={0.7}
									accessibilityRole="button"
									accessibilityState={{
										busy: loading && action === "hard",
										disabled: loading,
									}}
								>
									{loading && action === "hard" ? (
										<ActivityIndicator size="small" color="#FFFFFF" />
									) : (
										<Text style={styles.hardButtonText}>
											Permanently Delete
										</Text>
									)}
								</TouchableOpacity>
							</View>

							{/* Cancel Action */}
							<TouchableOpacity
								style={[styles.cancelButton, loading && styles.disabledButton]}
								onPress={onCancel}
								disabled={loading}
								activeOpacity={0.7}
								accessibilityRole="button"
							>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
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
		maxWidth: 360,
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
		backgroundColor: "#FEE4E2",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1D2939",
		marginBottom: 4,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 13,
		color: "#667085",
		textAlign: "center",
		marginBottom: 16,
		lineHeight: 18,
	},
	bannerWrapper: {
		width: "100%",
		marginBottom: 12,
	},
	optionBox: {
		width: "100%",
		backgroundColor: "#F9FAFB",
		borderRadius: 10,
		padding: 12,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: "#EAECF0",
	},
	hardBox: {
		backgroundColor: "#FFFBFA",
		borderColor: "#FECDCA",
	},
	optionTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#344054",
		marginBottom: 4,
	},
	optionDescription: {
		fontSize: 12,
		color: "#475467",
		lineHeight: 16,
		marginBottom: 10,
	},
	button: {
		height: 38,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	softButton: {
		backgroundColor: WARNING_ORANGE,
	},
	hardButton: {
		backgroundColor: RED,
	},
	softButtonText: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 13,
	},
	hardButtonText: {
		color: "#FFFFFF",
		fontWeight: "600",
		fontSize: 13,
	},
	cancelButton: {
		width: "100%",
		height: 40,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 4,
	},
	cancelText: {
		color: "#475467",
		fontWeight: "600",
		fontSize: 14,
	},
	disabledButton: {
		opacity: 0.6,
	},
});

export default AccountDeletionModal;
