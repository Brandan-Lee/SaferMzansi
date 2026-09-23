import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export const AlertBadge = ({ message, type = "error" }) => {
	if (!message) {
		return null;
	}

	const isError = type === "error";
	const bgStyle = isError ? styles.errorBg : styles.successBg;
	const textStyle = isError ? styles.errorText : styles.successText;
	const iconName = isError ? "alert-circle" : "check-circle";
	const iconColor = isError ? "#DC2626" : "#16A34A";

	return (
		<View style={[styles.container, bgStyle]}>
			<Feather
				name={iconName}
				size={18}
				color={iconColor}
				style={styles.icon}
			/>
			<Text style={[styles.message, textStyle]}>{message}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	errorBg: {
		backgroundColor: "#FEE2E2",
		borderWidth: 1,
		borderColor: "#FCA5A5",
	},
	successBg: {
		backgroundColor: "#DCFCE7",
		borderWidth: 1,
		borderColor: "#86EFAC",
	},
	icon: {
		marginRight: 8,
	},
	message: {
		fontSize: 14,
		fontWeight: "500",
		flex: 1,
	},
	errorText: {
		color: "#991B1B",
	},
	successText: {
		color: "#166534",
	},
});