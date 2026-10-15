import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@config/supabase_client";

const PURPLE = "#6B21A8";

const FilePreview = ({ fileObj }) => {
    const [resolvedUri, setResolvedUri] = useState("");

    useEffect(() => {
        let isMounted = true;

        const resolveUri = async () => {
            if (!fileObj) return;

            const rawUri = fileObj.uri || fileObj.local_file_url || fileObj.cloud_file_url;
            if (!rawUri) return;

            if (rawUri.startsWith("file://") || rawUri.startsWith("http")) {
                if (isMounted) setResolvedUri(rawUri);
                return;
            }

            try {
                const { data, error } = await supabase.storage
                    .from("EvidenceVault")
                    .createSignedUrl(rawUri, 300);

                if (!error && data?.signedUrl && isMounted) {
                    setResolvedUri(data.signedUrl);
                }
            } catch (err) {
                console.error("Failed to resolve card signed image URL:", err);
            }
        };

        resolveUri();

        return () => {
            isMounted = false;
        };
    }, [fileObj]);

    if (fileObj.type === "image" && resolvedUri) {
        return <Image source={{ uri: resolvedUri }} style={styles.previewImage} />;
    }
    if (fileObj.type === "video" && resolvedUri) {
        return (
            <View style={styles.videoPreviewContainer}>
                <Image source={{ uri: resolvedUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.playOverlay}>
                    <Feather name="play" size={12} color="#FFFFFF" />
                </View>
            </View>
        );
    }
    return <Feather name={fileObj.icon || "file-text"} size={22} color="#2D1638" />;
};

export default function EvidenceCard({ item, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.cardTop}>
                <Text style={styles.date}>{item.date}</Text>
                <Feather name="chevron-right" size={28} color="#2D1638" />
            </View>

            <View style={styles.fileRow}>
                {item.files.map((fileObj, index) => (
                    <View key={`${item.id}-${index}`} style={styles.fileIconContainer}>
                        <FilePreview fileObj={fileObj} />
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#F3E8FF",
        borderWidth: 1,
        borderColor: PURPLE,
        borderRadius: 16,
        padding: 16,
        minHeight: 120,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    date: { fontSize: 17, fontWeight: "bold", color: "#111827" },
    fileRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
        flexWrap: "wrap",
    },
    fileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#E9D5FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        marginBottom: 8,
        overflow: "hidden",
    },
    previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
    videoPreviewContainer: {
        width: "100%",
        height: "100%",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },
    playOverlay: {
        position: "absolute",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
});