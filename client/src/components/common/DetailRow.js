import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@constants/supportConstants";

export default function DetailRow({ icon, text }) {
	if (text === null || text === undefined || text === "") return null;
	return (
		<View style={styles.detailRow} accessible accessibilityLabel={text}>
			<Ionicons name={icon} size={16} color={THEME.purple} />
			<Text style={styles.detailText}>{text}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
	detailText: { flex: 1, fontSize: 13, color: "#222", lineHeight: 18 },
});
