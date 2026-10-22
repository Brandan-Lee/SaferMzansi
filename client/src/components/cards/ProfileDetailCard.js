import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SurfaceCard from "@components/common/SurfaceCard";
import { COLORS } from "@constants/uiTokens";

const ProfileDetailCard = ({ icon, label, value }) => {
	return (
		<SurfaceCard style={styles.row}>
			<View style={styles.rowIcon}>
				<Ionicons name={icon} size={18} color={COLORS.primary} />
			</View>
			<View style={styles.content}>
				<Text style={styles.rowLabel}>{label}</Text>
				<Text
					style={[styles.rowValue, !value && styles.rowValueEmpty]}
					numberOfLines={1}
				>
					{value ?? "Not provided"}
				</Text>
			</View>
		</SurfaceCard>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 12,
	},
	rowIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#EFE3FA",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	content: {
		flex: 1,
	},
	rowLabel: {
		fontSize: 12,
		color: "#666",
	},
	rowValue: {
		fontSize: 15,
		fontWeight: "600",
		color: "#111",
	},
	rowValueEmpty: {
		color: "#999",
		fontWeight: "400",
		fontStyle: "italic",
	},
});

export default ProfileDetailCard;
