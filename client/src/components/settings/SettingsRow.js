import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function SettingsRow({
	icon,
	title,
	onPress,
	value,
	isToggle = false,
	danger = false,
	materialIcon = false,
	isHighlighted = false,
	highlightColor,
}) {
	const color = danger ? "#DC2626" : "#2D1638";

	return (
		<TouchableOpacity
			style={styles.rowWrapper}
			onPress={onPress}
			activeOpacity={0.7}
			accessibilityRole={isToggle ? "switch" : "button"}
			accessibilityLabel={title}
			accessibilityState={isToggle ? { checked: value } : undefined}
		>
			<Animated.View
				style={[
					styles.row,
					isHighlighted && { backgroundColor: highlightColor },
				]}
			>
				<View style={styles.rowLeft}>
					{materialIcon ? (
						<MaterialCommunityIcons name={icon} size={25} color={color} />
					) : (
						<Feather name={icon} size={24} color={color} />
					)}
					<Text style={[styles.rowText, danger && styles.dangerText]}>
						{title}
					</Text>
				</View>

				{isToggle ? (
					<View
						style={[styles.checkbox, value && styles.checkboxActive]}
						accessible={false}
					>
						{value ? <Feather name="check" size={17} color="#FFFFFF" /> : null}
					</View>
				) : (
					<Feather name="chevron-right" size={24} color={color} />
				)}
			</Animated.View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	rowWrapper: { borderBottomWidth: 1, borderBottomColor: "#D8C7E8" },
	row: {
		minHeight: 64,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 4,
		gap: 12,
	},
	rowLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 14 },
	rowText: {
		flex: 1,
		fontSize: 16,
		fontWeight: "500",
		color: "#111827",
	},
	dangerText: { color: "#DC2626" },
	checkbox: {
		width: 26,
		height: 26,
		borderWidth: 1.5,
		borderColor: "#374151",
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
	},
	checkboxActive: { backgroundColor: "#6B21A8", borderColor: "#6B21A8" },
});
