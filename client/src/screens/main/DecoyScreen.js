import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, } from "react-native";
import { evaluate } from 'mathjs';
import { useNavigation } from "@react-navigation/native";

const DecoyScreen = () => {
	const navigation = useNavigation();

	const [pin, setPin] = useState("");

	const handleButtonPress = (value) => {
		setPin(pin + value);
	};

	const calculate = () => {
		if (pin === "1097") {
			navigation.navigate("EmergencyContactsScreen");
			return;
		}
		else if (pin === "1234") {
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
	};

	return (
		<View style={styles.container}>
			<View style={styles.screen}>
				<Text style={styles.text}>{pin || "0"}</Text>
			</View>

			<View style={styles.button}>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("7")}>
					<Text style={styles.buttonText}>7</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("8")}>
					<Text style={styles.buttonText}>8</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("9")}>
					<Text style={styles.buttonText}>9</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("/")}>
					<Text style={styles.buttonText}>/</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("4")}>
					<Text style={styles.buttonText}>4</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("5")}>
					<Text style={styles.buttonText}>5</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("6")}>
					<Text style={styles.buttonText}>6</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("*")}>
					<Text style={styles.buttonText}>x</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("1")}>
					<Text style={styles.buttonText}>1</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("2")}>
					<Text style={styles.buttonText}>2</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("3")}>
					<Text style={styles.buttonText}>3</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("-")}>
					<Text style={styles.buttonText}>-</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("0")}>
					<Text style={styles.buttonText}>0</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={() => handleButtonPress("+")}>
					<Text style={styles.buttonText}>+</Text>
				</Pressable>
				<Pressable style={styles.buttonEqual} onPress={calculate}>
					<Text style={styles.buttonText}>=</Text>
				</Pressable>
				<Pressable style={styles.buttons} onPress={clear}>
					<Text style={styles.buttonText}>C</Text>
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
	},
	screen: {
		height: 100,
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		marginBottom: 20,
		backgroundColor: "#eeeeee",
		borderRadius: 10,
		alignItems: "flex-end",
	},
	text: {
		fontSize: 35,
		fontWeight: "500",
	},
	button: {
		flexDirection: "row",
		gap: 10,
		flexWrap: "wrap",
		justifyContent: "center",
	},
	buttons: {
		width: '22%',
		height: 60,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#dddddd",
		borderRadius: 10,
	},
	buttonEqual: {
		width: '22%',
		height: 60,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#007AFF",
		borderRadius: 10,
	},
	buttonText: {
		fontSize: 25,
	},
});

export default DecoyScreen;
