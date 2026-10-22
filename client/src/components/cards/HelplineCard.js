import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SurfaceCard from "@components/common/SurfaceCard";
import { THEME } from "@constants/supportConstants";

export default function HelplineCard({ helpline, onPress }) {
	return (
		<SurfaceCard
			onPress={onPress}
			style={styles.helpline}
			accessibilityLabel={`${helpline.name}, ${helpline.phone}`}
			accessibilityHint="Calls this helpline"
		>
			<Text style={styles.helplineName}>{helpline.name}</Text>
			<View style={styles.helplineRight}>
				<Text style={styles.helplinePhone}>{helpline.phone}</Text>
				<Ionicons name="call" size={18} color={THEME.purple} />
			</View>
		</SurfaceCard>
	);
}

const styles = StyleSheet.create({
	helpline: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 12,
		paddingHorizontal: 14,
		marginBottom: 8,
	},
	helplineName: { flex: 1, fontSize: 14, color: THEME.title },
	helplineRight: { flexDirection: "row", alignItems: "center", gap: 8 },
	helplinePhone: { fontSize: 14, fontWeight: "700", color: THEME.purple },
});
