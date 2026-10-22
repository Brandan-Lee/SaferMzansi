import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CATEGORIES, THEME } from "@constants/supportConstants";

export default function CategoryLegend({ selectedCategory, onSelectCategory }) {
	return (
		<View style={styles.legend}>
			{Object.entries(CATEGORIES).map(([key, cat]) => {
				const selected = selectedCategory === key;
				return (
					<TouchableOpacity
						key={key}
						style={[
							styles.legendChip,
							selected && {
								backgroundColor: cat.color,
								borderColor: cat.color,
							},
						]}
						onPress={() => onSelectCategory(key)}
						activeOpacity={0.7}
						accessibilityRole="button"
						accessibilityLabel={`${cat.label} services`}
						accessibilityState={{ selected }}
					>
						<MaterialCommunityIcons
							name={selected ? "check-circle" : "map-marker"}
							size={18}
							color={selected ? "#fff" : cat.color}
						/>
						<Text
							style={[styles.legendText, selected && styles.legendTextSelected]}
							numberOfLines={1}
						>
							{cat.label}
						</Text>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	legend: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: 10,
		marginTop: 6,
	},
	legendChip: {
		width: "48.5%",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F3EBFB",
		borderWidth: 1,
		borderColor: THEME.purple,
		borderRadius: 16,
		paddingVertical: 6,
		paddingHorizontal: 8,
		gap: 4,
	},
	legendTextSelected: { color: "#fff" },
	legendText: { flex: 1, fontSize: 12, fontWeight: "600", color: THEME.title },
});
