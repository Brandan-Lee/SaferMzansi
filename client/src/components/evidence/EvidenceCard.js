import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import EvidenceFilePreview from "@components/evidence/EvidenceFilePreview";

const PURPLE = "#6B21A8";
const MAX_PREVIEWS = 4;

export default function EvidenceCard({ item = {}, onPress }) {
	const files = Array.isArray(item.files) ? item.files : [];
	const dateLabel = item.date || "Undated evidence";
	const remainingCount = Math.max(0, files.length - MAX_PREVIEWS);

	return (
		<Pressable
			style={({ pressed }) => [styles.card, pressed && styles.pressed]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${files.length} evidence files, added ${dateLabel}. Open evidence.`}
			accessibilityHint="Opens the files in this evidence group"
		>
			<View style={styles.header}>
				<View style={styles.heading}>
					<View style={styles.iconBadge}>
						<Feather name="shield" size={20} color={PURPLE} />
					</View>
					<View style={styles.headingText}>
						<Text style={styles.eyebrow}>SECURE EVIDENCE</Text>
						<Text style={styles.date} numberOfLines={2}>
							{dateLabel}
						</Text>
					</View>
				</View>
				<Feather name="chevron-right" size={22} color={PURPLE} />
			</View>

			<View style={styles.footer}>
				<View style={styles.previewRow}>
					{files.slice(0, MAX_PREVIEWS).map((file, index) => (
						<View
							key={`${file.evidence_id || item.id}-${index}`}
							style={styles.preview}
						>
							<EvidenceFilePreview file={file} size={48} />
						</View>
					))}
					{remainingCount > 0 ? (
						<View style={styles.moreFiles}>
							<Text style={styles.moreFilesText}>+{remainingCount}</Text>
						</View>
					) : null}
				</View>
				<View style={styles.fileCount}>
					<Text style={styles.countText}>
						{files.length} {files.length === 1 ? "file" : "files"}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#FFFFFF",
		borderColor: "#E5D8F0",
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
		gap: 16,
		shadowColor: "#2D1638",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 2,
	},
	pressed: { opacity: 0.88 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	heading: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
	iconBadge: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: "#F3E8FF",
		alignItems: "center",
		justifyContent: "center",
	},
	headingText: { flex: 1, gap: 3 },
	eyebrow: {
		color: PURPLE,
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.7,
	},
	date: { color: "#1F2937", fontSize: 16, fontWeight: "700" },
	footer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: 12,
	},
	previewRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
	},
	preview: {
		width: 52,
		height: 52,
		borderRadius: 14,
		backgroundColor: "#F3E8FF",
		alignItems: "center",
		justifyContent: "center",
	},
	moreFiles: {
		width: 48,
		height: 48,
		borderRadius: 14,
		backgroundColor: "#F3E8FF",
		alignItems: "center",
		justifyContent: "center",
	},
	moreFilesText: { color: PURPLE, fontSize: 14, fontWeight: "700" },
	fileCount: {
		backgroundColor: "#F7F2FB",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	countText: { color: "#4B5563", fontSize: 13, fontWeight: "600" },
});
