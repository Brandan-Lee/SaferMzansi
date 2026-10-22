import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PURPLE = "#6B21A8";
const BACKGROUND = "#FAF7FF";
const WHITE = "#FFFFFF";
const TEXT = "#1F1F1F";
const MUTED = "#666666";
const LIGHT_PURPLE = "#F1E5FA";
const BORDER = "#E4D5EF";

export const LEGAL_DOCUMENT_LAST_UPDATED = "October 21, 2026";

export const LegalParagraph = ({ children }) => (
	<Text style={styles.paragraph}>{children}</Text>
);

export const LegalSubheading = ({ children }) => (
	<Text style={styles.subheading}>{children}</Text>
);

export const LegalBullet = ({ children }) => (
	<View style={styles.bulletRow}>
		<View style={styles.bulletDot} />
		<Text style={styles.bulletText}>{children}</Text>
	</View>
);

export const LegalSection = ({ number, title, children }) => (
	<View style={styles.section}>
		<View style={styles.sectionHeader}>
			<View style={styles.numberCircle}>
				<Text style={styles.numberText}>{number}</Text>
			</View>
			<Text style={styles.sectionTitle}>{title}</Text>
		</View>
		<View style={styles.sectionContent}>{children}</View>
	</View>
);

export const LegalContactLine = ({ label, value }) => (
	<View style={styles.contactRow}>
		<Text style={styles.contactLabel}>{label}</Text>
		<Text style={styles.contactValue}>{value}</Text>
	</View>
);

export default function LegalModal({
	visible,
	onClose,
	title,
	lastUpdated,
	type = "document",
	children,
}) {
	const insets = useSafeAreaInsets();

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="slide"
			onRequestClose={onClose}
			statusBarTranslucent={true}
		>
			<View style={styles.overlay}>
				<View style={styles.modalContainer}>
					<View style={styles.handle} />

					<View style={styles.header}>
						<View style={styles.headerIcon}>
							<Feather
								name={type === "privacy" ? "shield" : "file-text"}
								size={23}
								color={PURPLE}
							/>
						</View>

						<View style={styles.headerText}>
							<Text style={styles.title}>{title}</Text>
							<Text style={styles.updated}>Last Updated: {lastUpdated}</Text>
						</View>
					</View>

					<View style={styles.divider} />

					<ScrollView
						style={styles.scroll}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={true}
						accessibilityLabel={`${title} content`}
					>
						{children}
					</ScrollView>

					<View
						style={[
							styles.footer,
							{ paddingBottom: Math.max(insets.bottom, 16) },
						]}
					>
						<TouchableOpacity
							activeOpacity={0.8}
							onPress={onClose}
							style={styles.closeButton}
							accessibilityRole="button"
						>
							<Text style={styles.closeButtonText}>Close</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 12,
		backgroundColor: "rgba(20, 8, 30, 0.68)",
	},
	modalContainer: {
		maxHeight: "94%",
		width: "100%",
		backgroundColor: WHITE,
		borderRadius: 24,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: BORDER,
	},
	handle: {
		width: 46,
		height: 5,
		borderRadius: 3,
		backgroundColor: "#D3BEDF",
		alignSelf: "center",
		marginTop: 10,
		marginBottom: 7,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 18,
		paddingTop: 18,
		paddingBottom: 18,
		backgroundColor: BACKGROUND,
	},
	headerIcon: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: WHITE,
		borderWidth: 1,
		borderColor: BORDER,
		justifyContent: "center",
		alignItems: "center",
	},
	headerText: {
		flex: 1,
		marginLeft: 12,
	},
	title: {
		color: PURPLE,
		fontSize: 22,
		fontWeight: "700",
	},
	updated: {
		color: MUTED,
		fontSize: 12,
		marginTop: 4,
	},
	xButton: {
		width: 48,
		height: 48,
		borderRadius: 16,
		backgroundColor: WHITE,
		borderWidth: 1,
		borderColor: BORDER,
		justifyContent: "center",
		alignItems: "center",
	},
	divider: {
		height: 1,
		backgroundColor: BORDER,
	},
	scroll: {
		flexShrink: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 18,
		paddingBottom: 24,
	},
	paragraph: {
		color: TEXT,
		fontSize: 15,
		lineHeight: 24,
		marginBottom: 16,
	},
	section: {
		padding: 16,
		marginBottom: 14,
		backgroundColor: "#FCFAFE",
		borderWidth: 1,
		borderColor: BORDER,
		borderRadius: 16,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 14,
	},
	numberCircle: {
		width: 31,
		height: 31,
		borderRadius: 16,
		backgroundColor: LIGHT_PURPLE,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 10,
	},
	numberText: {
		color: PURPLE,
		fontSize: 13,
		fontWeight: "700",
	},
	sectionTitle: {
		flex: 1,
		color: TEXT,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: "700",
		letterSpacing: 0.35,
	},
	sectionContent: { paddingLeft: 0 },
	subheading: {
		color: TEXT,
		fontSize: 14,
		lineHeight: 21,
		fontWeight: "700",
		marginBottom: 7,
		marginTop: 2,
	},
	bulletRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 10,
	},
	bulletDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: PURPLE,
		marginTop: 8,
		marginRight: 10,
	},
	bulletText: {
		flex: 1,
		color: TEXT,
		fontSize: 14,
		lineHeight: 23,
	},
	contactRow: {
		marginBottom: 12,
	},
	contactLabel: {
		color: TEXT,
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 3,
	},
	contactValue: {
		color: PURPLE,
		fontSize: 14,
		lineHeight: 21,
	},
	footer: {
		paddingHorizontal: 20,
		paddingTop: 14,
		backgroundColor: WHITE,
		borderTopWidth: 1,
		borderTopColor: BORDER,
	},
	closeButton: {
		minHeight: 52,
		borderRadius: 14,
		backgroundColor: PURPLE,
		justifyContent: "center",
		alignItems: "center",
	},
	closeButtonText: {
		color: WHITE,
		fontSize: 16,
		fontWeight: "700",
	},
});
