import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CATEGORIES } from "@constants/supportConstants";

export default function ServicePin({ category, selected }) {
	const { color, icon } = CATEGORIES[category];
	return (
		<View style={styles.pinWrap}>
			<View
				style={[
					styles.pin,
					{ backgroundColor: color },
					selected && styles.pinSelected,
				]}
			>
				<MaterialCommunityIcons
					name={icon}
					size={selected ? 18 : 15}
					color="#fff"
				/>
			</View>
			<View style={[styles.pinPointer, { borderTopColor: color }]} />
		</View>
	);
}

const styles = StyleSheet.create({
	pinWrap: { alignItems: "center" },
	pin: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#fff",
	},
	pinSelected: { width: 38, height: 38, borderRadius: 19, borderWidth: 3 },
	pinPointer: {
		width: 0,
		height: 0,
		borderLeftWidth: 6,
		borderRightWidth: 6,
		borderTopWidth: 8,
		borderLeftColor: "transparent",
		borderRightColor: "transparent",
		marginTop: -1,
	},
});
