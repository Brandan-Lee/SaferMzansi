import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { evaluate } from "mathjs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { verifyDecoyAttempt } from "@services/main/decoyService";

const DecoyScreen = ({ onDecoyUnlock, onEmergencyUnlock }) => {
	const navigation = useNavigation();
	const route = useRoute();
	const { isTesting } = route.params || {};

	const [pin, setPin] = useState("");
	const [emergencyPin, setEmergencyPin] = useState("");

	const unlockEmergencyContacts = () => {
		if (onEmergencyUnlock) {
			onEmergencyUnlock();
		} else {
			navigation.navigate("EmergencyContactsScreen");
		}
	};

	const handleButtonPress = (value) => {
		setPin(pin + value);
		setEmergencyPin(emergencyPin + value);
	};

	const calculate = async () => {
		if (isTesting) {
			if (pin === "1234") {
				navigation.goBack();
				return;
			} else if (pin === "0000") {
				unlockEmergencyContacts();
				return;
			}
		}

		const matchType = await verifyDecoyAttempt(pin);

		if (matchType === "emergency") {
			setPin("");
			unlockEmergencyContacts();
			return;
		}

		if (matchType === "decoy") {
			setPin("");
			if (onDecoyUnlock) {
				onDecoyUnlock();
			}
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

				{/* Row 5 */}
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
		width: 162,
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "flex-start",
		paddingLeft: 28,
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
		color: "#81C784",
		fontWeight: "500",
	},
	buttonOperator: {
		width: 75,
		height: 75,
		borderRadius: 38,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#2E3A59",
	},
	operatorButtonText: {
		fontSize: 30,
		color: "#8AB4F8",
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
