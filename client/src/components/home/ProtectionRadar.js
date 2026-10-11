import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Icon from "@expo/vector-icons/Ionicons";

const RADAR_SIZE = 230;
const INNER_CIRCLE_SIZE = 155;
const CENTER_BUTTON_SIZE = 88;
const ACTION_BUTTON_SIZE = 46;

const getRadialPosition = (angleInDegrees) => {
	const radius = RADAR_SIZE / 2;
	const radians = (angleInDegrees * Math.PI) / 180;
	return {
		left: radius + radius * Math.cos(radians) - ACTION_BUTTON_SIZE / 2,
		top: radius + radius * Math.sin(radians) - ACTION_BUTTON_SIZE / 2,
	};
};

export const ProtectionRadar = ({ actions = [], navigation }) => {
	return (
		<View style={styles.radarSection}>
			<View style={styles.radarContainer}>
				<View style={styles.outerRing} />
				<View style={styles.innerRing} />

				{/* Center Shield Badge (Static Display) */}
				<View style={styles.centerShield}>
					<View style={styles.logoBadge}>
						<Icon name="shield" size={42} color="#FFFFFF" />
						<Icon
							name="heart"
							size={18}
							color="#6B21A8"
							style={styles.logoBadgeHeart}
						/>
					</View>
				</View>

				{/* Orbiting Action Buttons */}
				{actions.map((action) => {
					const pos = getRadialPosition(action.angle);
					return (
						<TouchableOpacity
							key={action.id}
							style={[styles.radialButton, pos]}
							activeOpacity={0.7}
							onPress={() => action.route && navigation.navigate(action.route)}
						>
							<Feather name={action.icon} size={18} color="#FFFFFF" />
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	radarSection: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
	},
	radarContainer: {
		width: RADAR_SIZE,
		height: RADAR_SIZE,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	outerRing: {
		position: "absolute",
		width: RADAR_SIZE,
		height: RADAR_SIZE,
		borderRadius: RADAR_SIZE / 2,
		borderWidth: 2,
		borderColor: "#A855F7",
		backgroundColor: "rgba(168, 85, 247, 0.03)",
	},
	innerRing: {
		position: "absolute",
		width: INNER_CIRCLE_SIZE,
		height: INNER_CIRCLE_SIZE,
		borderRadius: INNER_CIRCLE_SIZE / 2,
		borderWidth: 2,
		borderColor: "#C084FC",
		backgroundColor: "rgba(192, 132, 252, 0.05)",
	},
	centerShield: {
		width: CENTER_BUTTON_SIZE,
		height: CENTER_BUTTON_SIZE,
		borderRadius: CENTER_BUTTON_SIZE / 2,
		backgroundColor: "#6B21A8",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
		elevation: 8,
		shadowColor: "#6B21A8",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 8,
		borderWidth: 3,
		borderColor: "#FFFFFF",
	},
	logoBadge: {
		alignItems: "center",
		justifyContent: "center",
	},
	logoBadgeHeart: {
		position: "absolute",
		top: 11,
	},
	radialButton: {
		position: "absolute",
		width: ACTION_BUTTON_SIZE,
		height: ACTION_BUTTON_SIZE,
		borderRadius: ACTION_BUTTON_SIZE / 2,
		backgroundColor: "#7E22CE",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 5,
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		borderWidth: 2,
		borderColor: "#FFFFFF",
	},
});