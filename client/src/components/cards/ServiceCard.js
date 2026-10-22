import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AppButton from "@components/common/AppButton";
import DetailRow from "@components/common/DetailRow";
import SurfaceCard from "@components/common/SurfaceCard";
import { CATEGORIES, THEME } from "@constants/supportConstants";
import {
	formatDistance,
	openDirections,
	isValidPhoneNumber,
} from "@utils/location/geoUtils";

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
		<SurfaceCard
			onPress={handlePress}
			style={[styles.card, selected && styles.cardSelected]}
			accessibilityLabel={`${cat.cardTitle}, ${place.name}`}
			accessibilityHint="Selects this place and shows its details"
			accessibilityState={{ selected }}
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
						<AppButton
							title="Directions"
							icon="navigate-outline"
							style={[styles.actionButton, styles.directionsButton]}
							fullWidth={false}
							onPress={(event) => {
								event.stopPropagation?.();
								openDirections(place);
							}}
						/>

						{/* Conditionally render the Call button ONLY if valid phone details exist */}
						{hasValidPhone && (
							<AppButton
								title="Call"
								icon="call-outline"
								iconColor="#FFFFFF"
								style={[styles.actionButton, styles.callButton]}
								fullWidth={false}
								onPress={(event) => {
									event.stopPropagation?.();
									onAttemptCall?.();
								}}
							/>
						)}
					</View>
				</View>
			)}
		</SurfaceCard>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#F3EBFB",
		borderColor: THEME.purple,
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
	},
	directionsButton: {
		backgroundColor: THEME.purple,
		marginTop: 0,
	},
	callButton: {
		backgroundColor: "#2E7D32",
		borderColor: "#2E7D32",
		marginTop: 0,
	},
});
