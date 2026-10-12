import { react, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";

const DecoyPinScreen = () => {
    const navigation = useNavigation();
    const [pin, setPin] = useState('');
    const [emergencyPin, setEmergencyPin] = useState('');

    const handleCreatePin = () => {
        if (pin.length !== 4 || emergencyPin.length !== 4) {
            Alert.alert("Error", "Please enter a valid 4-digit PIN for both fields.");
            return;
        }

        if (pin === emergencyPin) {
            Alert.alert("Error", "Decoy PIN and Emergency PIN cannot be the same.");
            return;
        }

        Alert.alert("Success", "Decoy PIN and Emergency PIN have been set successfully.", [
            {
                text: "OK", onPress: () => navigation.goBack(),
            },
        ]);
    };

    return (

        <View style={styles.container}>
            <View style={styles.logoBadge}>
                <Icon name="shield" size={34} color="#FFFFFF" />
                <Icon
                    name="heart"
                    size={14}
                    color="#6B21A8"
                    style={styles.logoBadgeHeart}
                />
            </View>
            <Text style={styles.logoText}>SaferMzansi</Text>
            <Text style={styles.title}> Decoy PIN</Text>
            <Text style={styles.subtitle}>Create a PIN for your decoy account</Text>

            <Text style={styles.label}>Enter your decoy PIN below:</Text>
            <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 4 digit PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry

            />
            <Text style={styles.label}>Enter your Emergency PIN below:</Text>
            <TextInput
                style={styles.input}
                value={emergencyPin}
                onChangeText={setEmergencyPin}
                placeholder="Enter 4 digit PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
            />

            <Pressable style={styles.button} onPress={handleCreatePin}>
                <Text style={styles.buttonText}>Create Pin</Text>
            </Pressable>
        </View>




    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        alignItems: "center",
        marginHorizontal: 20,
        justifyContent: "center",
        backgroundColor: "#FAF7FF",

    },
    logoBadge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: "#6B21A8",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    logoBadgeHeart: { position: "absolute" },
    logoText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#6B21A8",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
    },
    label: {
        width: "80%",
        fontSize: 16,
        color: "#1F2937",
        marginBottom: 8,
    },
    input: {
        width: "80%",
        height: 48,
        borderColor: "#d1d5db",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    button: {
        backgroundColor: "#6B21A8",
        paddingVertical: 14,
        alignItems: "center",
        borderRadius: 8,
        marginTop: 8,
        width: "80%",

    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },



});

export default DecoyPinScreen;