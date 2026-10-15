import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CATEGORIES, THEME } from "@constants/supportConstants";
import {
	formatDistance,
	openDirections,
	isValidPhoneNumber,
} from "@utils/location/geoUtils";
import DetailRow from "@components/common/DetailRow";

export default function ServiceCard({
	place,
	selected,
	expanded,
	onSelect,
	onToggleExpand,
	onAttemptCall,
}) {
	const cat = CATEGORIES[place.category];

	// Check if a valid phone number exists
	const hasValidPhone = isValidPhoneNumber(place.phone);

	const handlePress = () => {
		onSelect();
		onToggleExpand();
	};

	return (
		<TouchableOpacity
			style={[styles.card, selected && styles.cardSelected]}
			onPress={handlePress}
			activeOpacity={0.85}
		>
			<View style={styles.cardRow}>
				<View style={[styles.cardIcon, { backgroundColor: cat.color }]}>
					<MaterialCommunityIcons name={cat.icon} size={20} color="#fff" />
				</View>
				<View style={styles.cardText}>
					<Text style={styles.cardTitle}>{cat.cardTitle}</Text>
					<Text style={styles.cardName} numberOfLines={1}>
						{place.name}
					</Text>
					<Text style={styles.cardDistance}>
						{formatDistance(place.distance)}
					</Text>
				</View>
				<Ionicons
					name={expanded ? "chevron-up" : "chevron-down"}
					size={20}
					color={THEME.title}
				/>
			</View>

			{expanded && (
				<View style={styles.details}>
					<DetailRow icon="location-outline" text={place.address} />
					<DetailRow icon="time-outline" text={place.hours} />
					<DetailRow icon="call-outline" text={place.phone} />
					<DetailRow icon="information-circle-outline" text={place.about} />
					{place.isSample && (
						<Text style={styles.sampleNote}>Sample data fallback.</Text>
					)}

					{/* Action Buttons Row */}
					<View style={styles.actionButtonsRow}>
						<TouchableOpacity
							style={[styles.actionButton, styles.directionsButton]}
							onPress={(e) => {
								e.stopPropagation?.();
								openDirections(place);
							}}
						>
							<Ionicons name="navigate-outline" size={16} color="#fff" />
							<Text style={styles.actionButtonText}>Directions</Text>
						</TouchableOpacity>

						{/* Conditionally render the Call button ONLY if valid phone details exist */}
						{hasValidPhone && (
							<TouchableOpacity
								style={[styles.actionButton, styles.callButton]}
								onPress={(e) => {
									e.stopPropagation?.();
									onAttemptCall?.();
								}}
							>
								<Ionicons name="call-outline" size={16} color="#fff" />
								<Text style={styles.actionButtonText}>Call</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#F3EBFB",
		borderWidth: 1,
		borderColor: THEME.purple,
		borderRadius: 10,
		padding: 12,
		marginTop: 12,
	},
	cardSelected: { borderWidth: 2 },
	cardRow: { flexDirection: "row", alignItems: "center" },
	cardIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	cardText: { flex: 1 },
	cardTitle: { fontSize: 15, fontWeight: "700", color: THEME.title },
	cardName: { fontSize: 13, color: "#333" },
	cardDistance: { fontSize: 13, color: "#555" },
	details: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#D9C6EE",
		gap: 8,
	},
	sampleNote: { fontSize: 12, fontStyle: "italic", color: "#8A4B00" },
	actionButtonsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 8,
		gap: 10,
	},
	actionButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 10,
		borderRadius: 8,
		gap: 6,
	},
	directionsButton: {
		backgroundColor: THEME.purple || "#6A1B9A",
	},
	callButton: {
		backgroundColor: "#2E7D32",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 13,
	},
});
