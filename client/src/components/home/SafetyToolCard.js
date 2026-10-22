import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export const SafetyToolCard = ({ item = {}, onPress }) => {
	const IconComponent = item.icon;

	return (
		<TouchableOpacity
			activeOpacity={0.7}
			style={styles.gridCard}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${item.title || "Safety tool"}${item.subtitle ? `, ${item.subtitle}` : ""}`}
		>
			<View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
				{IconComponent && <IconComponent size={20} color={item.color} />}
			</View>
			<Text style={styles.cardTitle}>{item.title}</Text>
			<Text style={styles.cardSubtitle}>{item.subtitle}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	gridCard: {
		width: "48%",
		backgroundColor: "#FFFFFF",
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#F3E8FF",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 6,
		elevation: 2,
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 10,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 8,
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#0F172A",
		marginBottom: 4,
		textAlign: "center",
	},
	cardSubtitle: {
		fontSize: 12,
		fontWeight: "500",
		color: "#475569",
		textAlign: "center",
	},
});
