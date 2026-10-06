import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#5E0A9E";
const CARD = "#CDBBE0";
const AVATAR_BACKGROUND = "#EFE3FA";

export default function ContactCard({ item, onPress }) {
	const name =
		item.name ||
		`${item.firstName || ""} ${item.surname || ""}`.trim() ||
		"Unnamed Contact";
	const info = item.phone || item.email || "No contact info";

	return (
		<TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
			<View style={styles.avatar}>
				<Ionicons name="person-outline" size={18} color={PURPLE} />
			</View>
			<View style={styles.cardText}>
				<Text style={styles.name} numberOfLines={1}>
					{name}
				</Text>
				<Text style={styles.info} numberOfLines={1}>
					{info}
				</Text>
			</View>
			<Ionicons name="chevron-forward" size={22} color="#222" />
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: CARD,
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: AVATAR_BACKGROUND,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	cardText: { flex: 1 },
	name: { fontSize: 16, fontWeight: "600", color: "#111" },
	info: { fontSize: 12, color: "#222" },
});
