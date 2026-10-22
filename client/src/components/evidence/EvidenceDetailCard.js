import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import EvidenceFilePreview from "@components/evidence/EvidenceFilePreview";

const PURPLE = "#6B21A8";

export default function EvidenceDetailCard({
	file,
	index,
	onDownload,
	onDelete,
	onRestore,
}) {
	return (
		<View style={styles.fileCard}>
			<View style={styles.fileRow}>
				<View style={styles.filePreviewContainer}>
					<EvidenceFilePreview file={file} size={72} />
				</View>
				<View style={styles.fileInfo}>
					<Text style={styles.fileName} numberOfLines={2}>
						{file.name || `File #${index + 1}`}
					</Text>
					<Text style={styles.fileSize} numberOfLines={1}>
						{file.sizeFormatted || "Encrypted local storage"}
					</Text>
				</View>
			</View>
			<View style={styles.actionButtonsContainer}>
				{onRestore ? (
					<TouchableOpacity
						style={styles.actionButton}
						onPress={onRestore}
						activeOpacity={0.7}
						accessibilityRole="button"
					>
						<Feather name="rotate-ccw" size={17} color={PURPLE} />
						<Text style={styles.actionButtonText}>Restore</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={styles.actionButton}
						onPress={onDownload}
						disabled={!onDownload}
						activeOpacity={0.7}
						accessibilityRole="button"
					>
						<Feather name="download" size={17} color={PURPLE} />
						<Text style={styles.actionButtonText}>Download</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					style={[styles.actionButton, styles.deleteButton]}
					onPress={onDelete}
					activeOpacity={0.7}
					accessibilityRole="button"
				>
					<Feather name="trash-2" size={17} color="#B42318" />
					<Text style={[styles.actionButtonText, styles.deleteButtonText]}>
						Delete
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	fileCard: {
		backgroundColor: "#FFFFFF",
		padding: 14,
		borderRadius: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		gap: 12,
	},
	fileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	filePreviewContainer: {
		width: 76,
		height: 76,
		borderRadius: 12,
		backgroundColor: "#F3E8FF",
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	fileInfo: { flex: 1, gap: 4 },
	fileName: { fontSize: 15, fontWeight: "600", color: "#111827" },
	fileSize: { fontSize: 13, color: "#6B7280" },
	actionButtonsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "flex-end",
		gap: 8,
	},
	actionButton: {
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#F3E8FF",
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
		gap: 7,
	},
	actionButtonText: { fontSize: 14, fontWeight: "600", color: PURPLE },
	deleteButton: { backgroundColor: "#FEF3F2" },
	deleteButtonText: { color: "#B42318" },
});
