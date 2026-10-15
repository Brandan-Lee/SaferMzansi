import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

const PURPLE = "#6B21A8";

const FilePreview = ({ file }) => {
    if (file.type === "image") {
        return <Image source={{ uri: file.uri }} style={styles.thumbnailImage} />;
    }
    if (file.type === "video") {
        return (
            <View style={styles.videoWrapper}>
                <Image source={{ uri: file.uri }} style={styles.thumbnailImage} resizeMode="cover" />
                <View style={styles.playBadge}>
                    <Feather name="play" size={12} color="#FFFFFF" />
                </View>
            </View>
        );
    }
    return <Feather name={file.icon || "file-text"} size={24} color={PURPLE} />;
};

export default function EvidenceDetailCard({ file, index, onDownload, onDelete }) {
    return (
        <View style={styles.fileCard}>
            <View style={styles.filePreviewContainer}>
                <FilePreview file={file} />
            </View>

            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>
                    {file.name || `File #${index + 1}`}
                </Text>
                <Text style={styles.fileSize}>
                    {file.sizeFormatted || "Encrypted local storage"}
                </Text>
            </View>

            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onDownload}
                    activeOpacity={0.7}
                >
                    <Feather name="download" size={15} color={PURPLE} />
                    <Text style={styles.actionButtonText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={onDelete}
                    activeOpacity={0.7}
                >
                    <Feather name="trash-2" size={15} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fileCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    filePreviewContainer: {
        width: 46,
        height: 46,
        borderRadius: 10,
        backgroundColor: "#F3E8FF",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginRight: 10,
    },
    thumbnailImage: { width: "100%", height: "100%", resizeMode: "cover" },
    videoWrapper: { width: "100%", height: "100%", position: "relative", justifyContent: "center", alignItems: "center" },
    playBadge: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
    fileInfo: { flex: 1, marginRight: 6 },
    fileName: { fontSize: 14, fontWeight: "600", color: "#111827" },
    fileSize: { fontSize: 12, color: "#6B7280", marginTop: 2 },
    actionButtonsContainer: { flexDirection: "row", alignItems: "center" },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3E8FF",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 6,
    },
    actionButtonText: { fontSize: 13, fontWeight: "600", color: PURPLE, marginLeft: 4 },
    deleteButton: { backgroundColor: "#FEE2E2" },
    deleteButtonText: { color: "#EF4444" },
});