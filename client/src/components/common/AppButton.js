import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MIN_TOUCH_TARGET, RADII, SPACING } from "@constants/uiTokens";

export default function AppButton({
	title,
	onPress,
	loading = false,
	disabled = false,
	variant = "primary",
	icon,
	iconColor,
	style,
	textStyle,
	fullWidth = true,
	accessibilityLabel,
}) {
	const selectedVariant = VARIANTS[variant] || VARIANTS.primary;
	const isDisabled = disabled || loading;

	return (
		<Pressable
			style={({ pressed }) => [
				styles.button,
				selectedVariant.button,
				fullWidth && styles.fullWidth,
				isDisabled && styles.disabled,
				style,
				pressed && !isDisabled && styles.pressed,
			]}
			onPress={onPress}
			disabled={isDisabled}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel || title}
			accessibilityState={{ disabled: isDisabled, busy: loading }}
			accessibilityHint={loading ? "Please wait for the action to finish" : undefined}
		>
			{loading ? (
				<ActivityIndicator
					color={
						variant === "secondary" ? COLORS.primary : COLORS.surface
					}
				/>
			) : (
				<>
					{icon ? (
						<Ionicons
							name={icon}
							size={20}
							color={iconColor || selectedVariant.iconColor}
						/>
					) : null}
					<Text
						numberOfLines={1}
						style={[styles.text, selectedVariant.text, textStyle]}
					>
						{title}
					</Text>
				</>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		minHeight: MIN_TOUCH_TARGET,
		paddingVertical: SPACING.sm,
		paddingHorizontal: SPACING.lg,
		borderRadius: RADII.sm,
		marginTop: SPACING.md,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: SPACING.sm,
	},
	fullWidth: {
		width: "100%",
	},
	primary: {
		backgroundColor: COLORS.primary,
	},
	secondary: {
		backgroundColor: COLORS.surface,
		borderWidth: 1,
		borderColor: COLORS.primary,
	},
	destructive: {
		backgroundColor: COLORS.destructive,
	},
	disabled: {
		backgroundColor: COLORS.disabled,
		borderColor: COLORS.disabled,
		opacity: 0.7,
	},
	pressed: {
		opacity: 0.85,
	},
	text: {
		fontSize: 16,
		fontWeight: "600",
	},
	primaryText: {
		color: COLORS.surface,
	},
	secondaryText: {
		color: COLORS.primary,
	},
});

// Define variants after styles so their style references are ready at import time.
const VARIANTS = {
	primary: {
		button: styles.primary,
		text: styles.primaryText,
		iconColor: COLORS.surface,
	},
	secondary: {
		button: styles.secondary,
		text: styles.secondaryText,
		iconColor: COLORS.primary,
	},
	destructive: {
		button: styles.destructive,
		text: styles.primaryText,
		iconColor: COLORS.surface,
	},
};
