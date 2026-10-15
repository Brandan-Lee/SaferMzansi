import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";
import { Feather } from "@expo/vector-icons";
import MainLayout from "@components/layouts/MainLayout";
import EvidenceDetailCard from "@components/evidence/EvidenceDetailCard";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import DownloadModal from "@components/modals/DownloadModal";
import { deleteEvidence } from "@services/evidence/evidenceService";

export default function EvidenceVaultDetailsScreen() {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const route = useRoute();
  const { user } = useAuth();

  const evidenceItem = route?.params?.evidenceItem;

  // Modal States
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadModalState, setDownloadModalState] = useState({
    visible: false,
    loading: false,
    title: "",
    message: "",
  });

  if (!evidenceItem) {
    return (
      <MainLayout
        title="Evidence Details"
        onBack={() => navigation.replace("EvidenceVaultScreen")}
        tab="Vault"
        navigation={navigation}
      >
        <View style={styles.content}>
          <Feather name="alert-circle" size={80} color="#2D1638" />
          <Text style={styles.title}>No evidence selected</Text>
          <Text style={styles.subtitle}>Please select a valid record from the vault.</Text>
        </View>
      </MainLayout>
    );
  }

  const handleDownloadSingle = (file) => {
    setDownloadModalState({
      visible: true,
      loading: true,
      title: "Preparing Download",
      message: `Starting download for ${file.name || "File"}...`,
    });

    setTimeout(() => {
      setDownloadModalState({
        visible: true,
        loading: false,
        title: "Download Started",
        message: `${file.name || "File"} is being downloaded to your device storage.`,
      });
    }, 1200);
  };

  const handleDownloadAll = () => {
    setDownloadModalState({
      visible: true,
      loading: true,
      title: "Packaging Bundle",
      message: `Preparing all files.`,
    });

    setTimeout(() => {
      setDownloadModalState({
        visible: true,
        loading: false,
        title: "Bundle Ready",
        message: "All files have been successfully packaged and download has started.",
      });
    }, 1500);
  };

  const confirmDeleteFile = async () => {
    if (!db || !fileToDelete?.evidenceId || !user.userId) {
      Alert.alert("Error", "Missing required parameters for deletion.");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteEvidence(db, fileToDelete.evidenceId, user.userId);
      setFileToDelete(null);
      navigation.replace("EvidenceVaultScreen");
    } catch (error) {
      console.error("Failed to delete local evidence file:", error);
      Alert.alert("Error", "Could not delete file from local database.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout
      title="Evidence Details"
      onBack={() => navigation.replace("EvidenceVaultScreen")}
      tab="Vault"
      navigation={navigation}
      actionButton={{
        label: "Download All",
        icon: "cloud-download-outline",
        onPress: handleDownloadAll,
      }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateBanner}>
          <View>
            <Text style={styles.bannerSubtitle}>Recorded On</Text>
            <Text style={styles.bannerTitle}>{evidenceItem.date}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{evidenceItem.files.length} Files</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Attached Evidence Files</Text>

        {evidenceItem.files.map((file, index) => (
          <EvidenceDetailCard
            key={index}
            file={file}
            index={index}
            onDownload={() => handleDownloadSingle(file)}
            onDelete={() => setFileToDelete(file)}
          />
        ))}
      </ScrollView>

      {/* Reusable Confirmation Modal for Deletion */}
      <ConfirmationModal
        visible={!!fileToDelete}
        title="Delete File"
        message={`Are you sure you want to remove "${fileToDelete?.name || "this file"}" from your vault?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        iconName="trash-outline"
        loading={isDeleting}
        onConfirm={confirmDeleteFile}
        onCancel={() => !isDeleting && setFileToDelete(null)}
      />

      {/* Download Progress / Status Modal */}
      <DownloadModal
        visible={downloadModalState.visible}
        title={downloadModalState.title}
        message={downloadModalState.message}
        loading={downloadModalState.loading}
        onClose={() => setDownloadModalState((prev) => ({ ...prev, visible: false }))}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, marginTop: 100 },
  title: { fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#6B7280", textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30, paddingTop: 10 },
  dateBanner: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#6B21A8",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  bannerSubtitle: { fontSize: 13, color: "#6B7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  bannerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginTop: 4 },
  badgeContainer: { backgroundColor: "#E9D5FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: "#6B21A8", fontWeight: "bold", fontSize: 12 },
  sectionHeader: { fontSize: 16, fontWeight: "bold", color: "#374151", marginBottom: 14 },
});