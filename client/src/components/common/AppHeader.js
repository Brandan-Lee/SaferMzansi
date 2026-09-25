import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "@expo/vector-icons/Ionicons";

export const AppHeader = ({ title, subtitle }) => {
	return (
		<View style={styles.container}>
			<View style={styles.logoBadge}>
				<Icon name="shield" size={34} color="#FFFFFF" />
				<Icon
					name="heart"
					size={14}
					color="#6B21A8"
					style={styles.logoBadgeHeart}
				/>
			</View>
			<Text style={styles.logoText}>SaferMzansi</Text>
			{Boolean(title) && <Text style={styles.title}>{title}</Text>}
			{Boolean(subtitle) && <Text style={styles.subtitle}>{subtitle}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: "center", marginBottom: 24 },
	logoBadge: {
		width: 56,
		height: 56,
		borderRadius: 16,
		backgroundColor: "#6B21A8",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	logoBadgeHeart: { position: "absolute" },
	logoText: {
		fontSize: 24,
		fontWeight: "800",
		color: "#6B21A8",
		marginBottom: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1F2937",
		textAlign: "center",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		paddingHorizontal: 12,
	},
});
