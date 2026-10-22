import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@constants/supportConstants";

export default function LocationSegmentSelector({ mode, onSelectMode }) {
	return (
		<View style={styles.segment}>
			{["approximate", "exact"].map((m) => {
				const isExact = m === "exact";
				const selected = mode === m;
				const label = isExact ? "Exact location" : "Approximate";

				return (
				<TouchableOpacity
					key={m}
					style={[styles.segmentItem, selected && styles.segmentActive]}
					onPress={() => onSelectMode(m)}
					activeOpacity={0.8}
					accessibilityRole="button"
					accessibilityLabel={label}
					accessibilityState={{ selected }}
				>
					<Ionicons
						name={isExact ? "locate" : "radio-button-on-outline"}
						size={16}
						color={selected ? "#fff" : THEME.purple}
					/>
					<Text
						style={[styles.segmentText, selected && styles.segmentTextActive]}
					>
						{label}
					</Text>
				</TouchableOpacity>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	segment: {
		flexDirection: "row",
		backgroundColor: "#F3EBFB",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: THEME.purple,
		padding: 3,
		marginTop: 14,
	},
	segmentItem: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 8,
		borderRadius: 8,
		gap: 6,
	},
	segmentActive: { backgroundColor: THEME.purple },
	segmentText: { color: THEME.purple, fontWeight: "600", fontSize: 14 },
	segmentTextActive: { color: "#fff" },
});
