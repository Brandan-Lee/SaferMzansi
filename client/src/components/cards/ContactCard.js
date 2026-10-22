import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

const PURPLE = "#6B21A8";
const AVATAR_BACKGROUND = "#F3E8FF";

const ContactCard = ({ item, onPress }) => {
	const name =
		item.name ||
		`${item.firstName || ""} ${item.surname || ""}`.trim() ||
		"Unnamed Contact";
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join("");

	return (
		<TouchableOpacity
			style={styles.card}
			activeOpacity={0.75}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${name}, emergency contact. Open details.`}
		>
			<View style={styles.avatar}>
				<Text style={styles.initials}>{initials || "?"}</Text>
			</View>
			<View style={styles.cardText}>
				<Text style={styles.name} numberOfLines={1}>
					{name}
				</Text>
				<View style={styles.details}>
					{item.phone ? (
						<View style={styles.detailLine}>
							<Feather name="phone" size={14} color="#667085" />
							<Text style={styles.info} numberOfLines={1}>{item.phone}</Text>
						</View>
					) : null}
					{item.email ? (
						<View style={styles.detailLine}>
							<Feather name="mail" size={14} color="#667085" />
							<Text style={styles.info} numberOfLines={1}>{item.email}</Text>
						</View>
					) : null}
					{!item.phone && !item.email ? (
						<Text style={styles.info}>No contact details</Text>
					) : null}
				</View>
			</View>
			<Feather name="chevron-right" size={20} color={PURPLE} />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#E5D8F0",
		borderRadius: 16,
		paddingVertical: 14,
		paddingHorizontal: 16,
		minHeight: 80,
		gap: 12,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 16,
		backgroundColor: AVATAR_BACKGROUND,
		justifyContent: "center",
		alignItems: "center",
	},
	initials: { fontSize: 17, fontWeight: "700", color: PURPLE },
	cardText: { flex: 1, gap: 5 },
	name: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
	details: { gap: 3 },
	detailLine: { flexDirection: "row", alignItems: "center", gap: 7 },
	info: { flex: 1, fontSize: 13, color: "#475467" },
});

export default ContactCard;
