import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";
import { Feather } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import EvidenceDetailCard from "@components/evidence/EvidenceDetailCard";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import {
    getDeletedEvidence,
    restoreEvidence,
    permanentlyDeleteEvidence,
} from "@services/main/evidenceService";

const RecycleBinScreen = () => {
    const navigation = useNavigation();
    const db = useSQLiteContext();
    const { user } = useAuth();
    const [banner, setBanner] = useState(null);

    const [deletedGroups, setDeletedGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const loadDeletedItems = async () => {
        if (!db || !user?.userId) return;
        try {
            setLoading(true);
            const result = await getDeletedEvidence(db, user.userId);
            if (result.success) setDeletedGroups(result.data);
        } catch (error) {
            console.error("Failed to load recycle bin items:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDeletedItems();
        }, [db, user])
    );

    const handleConfirmAction = async () => {
        if (!modalConfig) return;
        const { file, action } = modalConfig;
        const fileId = file.evidenceId;
        const userId = user?.userId;

        try {
            setIsActionLoading(true);
            if (action === "restore") {
                await restoreEvidence(db, fileId, userId);
                setBanner({
                    message: "Evidence restored successfully to your vault.",
                    type: "success",
                });
            } else {
                await permanentlyDeleteEvidence(db, fileId, userId);
            }
            setModalConfig(null);
            loadDeletedItems();
        } catch (error) {
            console.error(`Failed to ${action} file:`, error);
            setBanner({
                message: `Could not ${action} file.`,
                type: "error",
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const totalFilesCount = deletedGroups.reduce(
        (acc, group) => acc + (group.files?.length || 0),
        0
    );

    const isRestore = modalConfig?.action === "restore";

    return (
        <MainLayout
            title="Recycle Bin"
            onBack={() => navigation.goBack()}
            tab="Settings"
            banner={banner}
            navigation={navigation}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.intro}>
                    <View style={styles.iconBadge}>
                        <Feather name="trash-2" size={28} color="#6b21a8" />
                    </View>
                    <Text style={styles.title}>Recently Deleted</Text>
                    <Text style={styles.subtitle}>
                        Evidence you remove from your vault appears here. You can
                        restore an item within 30 days or choose to delete it permanently.
                    </Text>
                </View>

                {totalFilesCount === 0 ? (
                    <View style={styles.emptyCard}>
                        <Feather name="trash-2" size={42} color="#9ca3af" />
                        <Text style={styles.emptyTitle}>Your Recycle Bin is empty</Text>
                        <Text style={styles.emptyText}>Deleted evidence will appear here</Text>
                    </View>
                ) : (
                    deletedGroups.map((group, groupIndex) => (
                        <View key={groupIndex} style={{ marginBottom: 20 }}>
                            <View style={styles.dateBanner}>
                                <Text style={styles.bannerTitle}>{group.date}</Text>
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{group.files.length} Files</Text>
                                </View>
                            </View>

                            {group.files.map((file, fileIndex) => (
                                <View key={fileIndex} style={styles.fileCardWrapper}>
                                    <EvidenceDetailCard
                                        file={file}
                                        index={fileIndex}
                                        onRestore={() => setModalConfig({ file, action: "restore" })}
                                        onDelete={() => setModalConfig({ file, action: "permanent" })}
                                    />
                                </View>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>

            <ConfirmationModal
                visible={!!modalConfig}
                title={isRestore ? "Restore Evidence" : "Delete Permanently"}
                message={
                    isRestore
                        ? `Are you sure you want to restore "${modalConfig?.file?.name || "this file"}" back to your vault?`
                        : `Are you sure you want to permanently delete "${modalConfig?.file?.name || "this file"}"? This action cannot be undone.`
                }
                confirmLabel={isRestore ? "Restore" : "Delete Forever"}
                cancelLabel="Cancel"
                isDestructive={!isRestore}
                iconName={isRestore ? "refresh" : "trash-outline"}
                loading={isActionLoading}
                onConfirm={handleConfirmAction}
                onCancel={() => !isActionLoading && setModalConfig(null)}
            />
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    scrollView: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 },
    intro: { alignItems: "center", marginBottom: 30 },
    iconBadge: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: "#f0e4fa",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    title: { fontSize: 24, fontWeight: "800", color: "#6b21a8", marginBottom: 8 },
    subtitle: { fontSize: 14, lineHeight: 21, color: "#6b7280", textAlign: "center" },
    emptyCard: {
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e9e1f0",
        paddingVertical: 38,
        paddingHorizontal: 20,
    },
    emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1f2937", marginTop: 14, marginBottom: 7 },
    emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center" },
    dateBanner: {
        backgroundColor: "#F3E8FF",
        borderWidth: 1,
        borderColor: "#6B21A8",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    bannerTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
    badgeContainer: { backgroundColor: "#E9D5FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
    badgeText: { color: "#6B21A8", fontWeight: "bold", fontSize: 12 },
    fileCardWrapper: { marginBottom: 12 },
});

export default RecycleBinScreen;