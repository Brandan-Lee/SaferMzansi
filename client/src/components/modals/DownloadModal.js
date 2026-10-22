import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#6B21A8";

export default function DownloadModal({
	visible,
	title,
	message,
	loading,
	result,
	onClose,
}) {
	const resultColor = result === "error" ? "#B42318" : PURPLE;
	const resultIcon =
		result === "error" ? "close-circle-outline" : "checkmark-circle-outline";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <View style={[
						styles.iconContainer,
						{ backgroundColor: result === "error" ? "#FEF3F2" : "#EFE3FA" },
					]}>
                        <Ionicons
                            name={loading ? "cloud-download-outline" : resultIcon}
                            size={28}
                            color={resultColor}
                        />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {loading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color={PURPLE} />
                            <Text style={styles.loaderText}>Preparing secure bundle...</Text>
                        </View>
                    )}

                    {!loading && (
                        <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.7}>
                            <Text style={styles.buttonText}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1D2939",
        marginBottom: 6,
        textAlign: "center",
    },
    message: {
        fontSize: 14,
        color: "#667085",
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 20,
    },
    loaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 4,
        gap: 10,
    },
    loaderText: {
        fontSize: 13,
        color: "#475467",
        fontWeight: "500",
    },
    button: {
        width: "100%",
        minHeight: 48,
		paddingVertical: 12,
        backgroundColor: PURPLE,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 14,
    },
});