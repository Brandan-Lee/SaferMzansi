import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet } from "react-native";

export const PrimaryButton = ({
	title,
	onPress,
	loading,
	disabled,
	variant = "primary",
}) => {
	let buttonStyle = styles.primaryButton;
	if (variant === "secondary") buttonStyle = styles.secondaryButton;
	if (variant === "destructive") buttonStyle = styles.destructiveButton;
	return (
		<Pressable
			style={({ pressed }) => [
				styles.button,
				buttonStyle,
				(disabled || loading) && styles.disabled,
				pressed && !disabled && !loading && styles.pressed,
			]}
			onPress={onPress}
			disabled={disabled || loading}
			accessibilityRole="button"
			accessibilityState={{ disabled: disabled || loading, busy: loading }}
		>
			{loading ? (
				<ActivityIndicator
					color={variant === "secondary" ? "#6B21A8" : "#FFFFFF"}
				/>
			) : (
				<Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>
					{title}
				</Text>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		minHeight: 48,
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
	primaryButton: { backgroundColor: "#6B21A8" },
	secondaryButton: {
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#6B21A8",
	},
	destructiveButton: { backgroundColor: "#B42318" },
	secondaryText: { color: "#6B21A8" },
	disabled: {
		backgroundColor: "#9CA3AF",
		opacity: 0.6,
	},
	text: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
	},
});