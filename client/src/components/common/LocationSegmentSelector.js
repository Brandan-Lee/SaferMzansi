import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@constants/supportConstants";

export default function LocationSegmentSelector({ mode, onSelectMode }) {
	return (
		<View style={styles.segment}>
			{["approximate", "exact"].map((m) => (
				<TouchableOpacity
					key={m}
					style={[styles.segmentItem, mode === m && styles.segmentActive]}
					onPress={() => onSelectMode(m)}
					activeOpacity={0.8}
				>
					<Ionicons
						name={m === "exact" ? "locate" : "radio-button-on-outline"}
						size={16}
						color={mode === m ? "#fff" : THEME.purple}
					/>
					<Text
						style={[styles.segmentText, mode === m && styles.segmentTextActive]}
					>
						{m === "exact" ? "Exact location" : "Approximate"}
					</Text>
				</TouchableOpacity>
			))}
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
