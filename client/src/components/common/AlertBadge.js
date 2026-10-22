import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export const AlertBadge = ({ message, type = "error", duration = 4000, onDismiss }) => {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		setVisible(true);
		if (!message || duration <= 0) return undefined;
		const timer = setTimeout(() => {
			setVisible(false);
			onDismiss?.();
		}, duration);
		return () => clearTimeout(timer);
	}, [message, duration, onDismiss]);

	if (!message || !visible) {
		return null;
	}

	const normalizedType = String(type).toLowerCase();
	const isError = normalizedType === "error";
	const isWarning = normalizedType === "warning";
	const bgStyle = isError
		? styles.errorBg
		: isWarning
			? styles.warningBg
			: styles.successBg;
	const textStyle = isError
		? styles.errorText
		: isWarning
			? styles.warningText
			: styles.successText;
	const iconName = isError || isWarning ? "alert-circle" : "check-circle";
	const iconColor = isError ? "#DC2626" : isWarning ? "#B54708" : "#16A34A";

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
	warningBg: {
		backgroundColor: "#FEF3C7",
		borderWidth: 1,
		borderColor: "#FCD34D",
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
	warningText: {
		color: "#92400E",
	},
	successText: {
		color: "#166534",
	},
});