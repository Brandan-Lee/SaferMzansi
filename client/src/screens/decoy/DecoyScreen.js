import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { evaluate } from "mathjs";
import { useNavigation } from "@react-navigation/native";

const DecoyScreen = () => {
	const navigation = useNavigation();

	const [pin, setPin] = useState("");
	const [emergencyPin, setEmergencyPin] = useState("");

	const handleButtonPress = (value) => {
		setPin(pin + value);
		setEmergencyPin(emergencyPin + value);
	};

	const calculate = () => {
		if (emergencyPin === "1097") {
			navigation.navigate("EmergencyContactsScreen");
			return;
		} else if (pin === "1234") {
			navigation.navigate("HomeScreen");
			return;
		}
		try {
			const result = evaluate(pin);
			setPin(result.toString());
		} catch (error) {
			setPin("Error");
		}
	};

	const clear = () => {
		setPin("");
		setEmergencyPin("");
	};

	return (
		<View style={styles.container}>
			{/* Calculator Display */}
			<View style={styles.screen}>
				<Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit>
					{pin || "0"}
				</Text>
			</View>

			{/* Keypad Grid */}
			<View style={styles.keypad}>
				{/* Row 1 */}
				<View style={styles.row}>
					<Pressable style={styles.buttonFunction} onPress={clear}>
						<Text style={styles.functionButtonText}>C</Text>
					</Pressable>
					<Pressable
						style={styles.buttonFunction}
						onPress={() => handleButtonPress("(")}
					>
						<Text style={styles.functionButtonText}>(</Text>
					</Pressable>
					<Pressable
						style={styles.buttonFunction}
						onPress={() => handleButtonPress(")")}
					>
						<Text style={styles.functionButtonText}>)</Text>
					</Pressable>
					<Pressable
						style={styles.buttonOperator}
						onPress={() => handleButtonPress("/")}
					>
						<Text style={styles.operatorButtonText}>÷</Text>
					</Pressable>
				</View>

				{/* Row 2 */}
				<View style={styles.row}>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("7")}
					>
						<Text style={styles.numberButtonText}>7</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("8")}
					>
						<Text style={styles.numberButtonText}>8</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("9")}
					>
						<Text style={styles.numberButtonText}>9</Text>
					</Pressable>
					<Pressable
						style={styles.buttonOperator}
						onPress={() => handleButtonPress("*")}
					>
						<Text style={styles.operatorButtonText}>×</Text>
					</Pressable>
				</View>

				{/* Row 3 */}
				<View style={styles.row}>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("4")}
					>
						<Text style={styles.numberButtonText}>4</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("5")}
					>
						<Text style={styles.numberButtonText}>5</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("6")}
					>
						<Text style={styles.numberButtonText}>6</Text>
					</Pressable>
					<Pressable
						style={styles.buttonOperator}
						onPress={() => handleButtonPress("-")}
					>
						<Text style={styles.operatorButtonText}>-</Text>
					</Pressable>
				</View>

				{/* Row 4 */}
				<View style={styles.row}>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("1")}
					>
						<Text style={styles.numberButtonText}>1</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("2")}
					>
						<Text style={styles.numberButtonText}>2</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress("3")}
					>
						<Text style={styles.numberButtonText}>3</Text>
					</Pressable>
					<Pressable
						style={styles.buttonOperator}
						onPress={() => handleButtonPress("+")}
					>
						<Text style={styles.operatorButtonText}>+</Text>
					</Pressable>
				</View>

				{/* Row 5 (Aligned 4-Column Grid: 0 spans 2 columns) */}
				<View style={styles.row}>
					<Pressable
						style={styles.buttonZero}
						onPress={() => handleButtonPress("0")}
					>
						<Text style={styles.numberButtonText}>0</Text>
					</Pressable>
					<Pressable
						style={styles.buttonNumber}
						onPress={() => handleButtonPress(".")}
					>
						<Text style={styles.numberButtonText}>.</Text>
					</Pressable>
					<Pressable style={styles.buttonEqual} onPress={calculate}>
						<Text style={styles.equalButtonText}>=</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
		padding: 20,
		justifyContent: "flex-end",
	},
	screen: {
		flex: 1,
		justifyContent: "flex-end",
		alignItems: "flex-end",
		paddingBottom: 30,
	},
	text: {
		fontSize: 56,
		fontWeight: "300",
		color: "#E0E0E0",
		textAlign: "right",
	},
	keypad: {
		paddingBottom: 20,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	buttonNumber: {
		width: 75,
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#2D2D2D",
	},
	buttonZero: {
		width: 162, // Exactly spans two columns + gap (75 + 75 + 12 gap)
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "flex-start",
		paddingLeft: 28, // Pints the '0' nicely towards the left like Android calc
		backgroundColor: "#2D2D2D",
	},
	numberButtonText: {
		fontSize: 28,
		color: "#E0E0E0",
		fontWeight: "400",
	},
	buttonFunction: {
		width: 75,
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#424242",
	},
	functionButtonText: {
		fontSize: 26,
		color: "#81C784", // Soft green highlight for utility functions
		fontWeight: "500",
	},
	buttonOperator: {
		width: 75,
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#2E3A59", // Deep blue-grey for operators
	},
	operatorButtonText: {
		fontSize: 30,
		color: "#8AB4F8", // Google Material blue accent
		fontWeight: "400",
	},
	buttonEqual: {
		width: 75,
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#8AB4F8",
	},
	equalButtonText: {
		fontSize: 32,
		color: "#202124",
		fontWeight: "600",
	},
});

export default DecoyScreen;
