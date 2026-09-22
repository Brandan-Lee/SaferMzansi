import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

export const CustomInput = ({
	label,
	icon,
	value,
	onChangeText,
	onBlur,
	placeholder,
	secureTextEntry,
	keyboardType = "default",
	autoCapitalize = "none",
	error,
}) => {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);

	const isSecure = secureTextEntry && !isPasswordVisible;
	const iconColor = error ? "#DC2626" : "#6B21A8";

	return (
		<View style={styles.container}>
			{label && <Text style={styles.label}>{label}</Text>}
			<View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
				{icon && (
					<Feather
						name={icon}
						size={18}
						color={iconColor}
						style={styles.icon}
					/>
				)}
				<TextInput
					style={styles.input}
					placeholder={placeholder}
					placeholderTextColor="#9CA3AF" // Softened placeholder color
					value={value}
					onChangeText={onChangeText}
					onBlur={onBlur}
					secureTextEntry={isSecure} // Uses toggle state
					keyboardType={keyboardType}
					autoCapitalize={autoCapitalize}
				/>
				{secureTextEntry && (
					<Pressable
						onPress={() => setIsPasswordVisible((prev) => !prev)}
						hitSlop={8}
					>
						<Feather
							name={isPasswordVisible ? "eye-off" : "eye"}
							size={18}
							color="#6B7280"
						/>
					</Pressable>
				)}
			</View>
			{error && <Text style={styles.errorText}>{error}</Text>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
		marginBottom: 12,
	},
	label: {
		fontSize: 15,
		fontWeight: "500",
		marginBottom: 4,
		color: "#111827",
	},
	inputWrapper: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderWidth: 1,
		borderColor: "#D1D5DB",
		borderRadius: 8,
		paddingHorizontal: 12,
	},
	inputWrapperError: {
		borderColor: "#DC2626",
		borderWidth: 1.5,
	},
	icon: {
		marginRight: 8,
	},
	input: {
		flex: 1,
		height: 44,
		color: "#111827",
	},
	errorText: {
		color: "#DC2626",
		fontSize: 12,
		marginTop: 4,
		fontWeight: "500",
	},
});
