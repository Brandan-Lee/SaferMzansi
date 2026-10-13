import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#5E0A9E";

const ProfileDetailCard = ({ icon, label, value }) => {
	return (
		<View style={styles.row}>
			<View style={styles.rowIcon}>
				<Ionicons name={icon} size={18} color={PURPLE} />
			</View>
			<View style={styles.content}>
				<Text style={styles.rowLabel}>{label}</Text>
				<Text
					style={[styles.rowValue, !value && styles.rowValueEmpty]}
					numberOfLines={1}
				>
					{value || "Not provided"}
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1,
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
