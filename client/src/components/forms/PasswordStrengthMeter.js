import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { getPasswordStrength } from "@utils/securityAndValidation/validationUtil";

const PasswordStrengthMeter = ({ password = "" }) => {
	const score = getPasswordStrength(password);

	const checks = {
		length: password.length >= 8,
		uppercase: /[A-Z]/.test(password),
		lowercase: /[a-z]/.test(password),
		number: /[0-9]/.test(password),
		symbol: /[^A-Za-z0-9]/.test(password),
	};

	const config = [
		{
			label: "Very Weak",
			textColor: "#991B1B",
			bgColor: "#FEE2E2",
		},
		{
			label: "Weak",
			textColor: "#9A3412",
			bgColor: "#FFEDD5",
		},
		{
			label: "Fair",
			textColor: "#92400E",
			bgColor: "#FEF3C7",
		},
		{
			label: "Good",
			textColor: "#065F46",
			bgColor: "#D1FAE5",
		},
		{
			label: "Strong",
			textColor: "#581C87",
			bgColor: "#F3E8FF",
		},
		{
			label: "Very Strong",
			textColor: "#3B0764",
			bgColor: "#E9D5FF",
		},
	];

	const currentLevel = config[Math.min(score, 5)];

	const getBarColor = (step) => {
		const isActive = score >= step;
		if (!isActive) return styles.barInactive;

		if (score <= 2) return styles.barRed;
		if (score === 3) return styles.barOrange;
		if (score === 4) return styles.barGreen;
		return styles.barPurple;
	};

	return (
		<View style={styles.container}>
			{/* Header Row */}
			<View style={styles.headerRow}>
				<Text style={styles.headerText}>Password strength</Text>

				<View style={[styles.badge, { backgroundColor: currentLevel.bgColor }]}>
					<Text style={[styles.badgeText, { color: currentLevel.textColor }]}>
						{currentLevel.label}
					</Text>
				</View>
			</View>

			{/* Progress Bars */}
			<View style={styles.barContainer}>
				{[1, 2, 3, 4, 5].map((step) => (
					<View key={step} style={[styles.barBase, getBarColor(step)]} />
				))}
			</View>

			{/* Rules Checklist Card */}
			<View style={styles.rulesCard}>
				{/* Rule 1 */}
				<View style={styles.ruleRow}>
					<Feather
						name={checks.length ? "check-circle" : "circle"}
						size={16}
						color={checks.length ? "#047857" : "#6B7280"}
					/>
					<Text
						style={[
							styles.ruleText,
							checks.length ? styles.ruleValid : styles.ruleInvalid,
						]}
					>
						At least 8 characters
					</Text>
				</View>

				{/* Rule 2 */}
				<View style={styles.ruleRow}>
					<Feather
						name={
							checks.uppercase && checks.lowercase ? "check-circle" : "circle"
						}
						size={16}
						color={checks.uppercase && checks.lowercase ? "#047857" : "#6B7280"}
					/>
					<Text
						style={[
							styles.ruleText,
							checks.uppercase && checks.lowercase
								? styles.ruleValid
								: styles.ruleInvalid,
						]}
					>
						Uppercase & lowercase letters
					</Text>
				</View>

				{/* Rule 3 */}
				<View style={styles.ruleRow}>
					<Feather
						name={checks.number ? "check-circle" : "circle"}
						size={16}
						color={checks.number ? "#047857" : "#6B7280"}
					/>
					<Text
						style={[
							styles.ruleText,
							checks.number ? styles.ruleValid : styles.ruleInvalid,
						]}
					>
						At least one number
					</Text>
				</View>

				{/* Rule 4 */}
				<View style={styles.ruleRow}>
					<Feather
						name={checks.symbol ? "check-circle" : "circle"}
						size={16}
						color={checks.symbol ? "#047857" : "#6B7280"}
					/>
					<Text
						style={[
							styles.ruleText,
							checks.symbol ? styles.ruleValid : styles.ruleInvalid,
						]}
					>
						At least one special character
					</Text>
				</View>
			</View>
		</View>
	);
};

const PURPLE = "#6B21A8";

const styles = StyleSheet.create({
	container: {
		width: "100%",
		marginTop: 8,
		marginBottom: 16,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	headerText: {
		color: "#111827", // Very dark gray for crisp reading
		fontSize: 14,
		fontWeight: "700",
	},
	badge: {
		paddingHorizontal: 10,
		paddingVertical: 3,
		borderRadius: 12,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: "800",
	},
	barContainer: {
		flexDirection: "row",
		height: 6,
		gap: 6,
		marginBottom: 12,
	},
	barBase: {
		flex: 1,
		height: "100%",
		borderRadius: 3,
	},
	barInactive: {
		backgroundColor: "#D1D5DB", // Solid light-gray track instead of transparent fill
	},
	barRed: {
		backgroundColor: "#B91C1C",
	},
	barOrange: {
		backgroundColor: "#C2410C",
	},
	barGreen: {
		backgroundColor: "#047857",
	},
	barPurple: {
		backgroundColor: PURPLE,
	},
	rulesCard: {
		backgroundColor: "#FFFFFF", // White background block for max contrast against the purple screen
		borderRadius: 10,
		padding: 12,
		gap: 8,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	ruleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	ruleText: {
		fontSize: 13,
	},
	ruleValid: {
		color: "#047857",
		fontWeight: "700",
	},
	ruleInvalid: {
		color: "#374151", // Darker gray for unfulfilled rules so it's easily readable
		fontWeight: "500",
	},
});

export default PasswordStrengthMeter;
