import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, RADII, SPACING } from "@constants/uiTokens";

export default function SurfaceCard({
	children,
	onPress,
	style,
	accessibilityLabel,
	accessibilityHint,
	accessibilityState,
	accessibilityRole = "button",
	disabled = false,
}) {
	// A static card should not be announced as a button if it cannot be pressed.
	if (!onPress) {
		return (
			<View style={[styles.card, style]} accessible={false}>
				{children}
			</View>
		);
	}

	return (
		<Pressable
			style={({ pressed }) => [
				styles.card,
				style,
				pressed && !disabled && styles.pressed,
			]}
			onPress={onPress}
			disabled={disabled}
			accessibilityRole={accessibilityRole}
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessibilityState={{ ...accessibilityState, disabled }}
		>
			{children}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderRadius: RADII.lg,
		padding: SPACING.lg,
		shadowColor: "#000000",
		shadowOpacity: 0.06,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1,
	},
	pressed: {
		opacity: 0.85,
	},
});
