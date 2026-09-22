import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";

export const PrimaryButton = ({ title, onPress, loading, disabled }) => {
	return (
		<Pressable
			style={({ pressed }) => [
				styles.button,
				(disabled || loading) && styles.disabled,
				pressed && !disabled && !loading && styles.pressed,
			]}
			onPress={onPress}
			disabled={disabled || loading}
		>
			{loading ? (
				<ActivityIndicator color="#FFFFFF" />
			) : (
				<Text style={styles.text}>{title}</Text>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		backgroundColor: "#6B21A8",
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 10,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		backgroundColor: "#A855F7",
		opacity: 0.6,
	},
	text: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});
