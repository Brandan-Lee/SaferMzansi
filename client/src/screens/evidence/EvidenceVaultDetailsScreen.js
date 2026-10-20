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
import { deleteEvidence } from "@services/main/evidenceService";
import {
	downloadToDownloadsDirectory,
	downloadFilesAsZip,
} from "@utils/downloadUtil";

const getFileId = (file) => file.evidence_id || file.evidenceId;

const getFileName = (file) => {
	const localUrl = file.local_file_url || file.localFileUrl || file.uri || "";
	const evidenceId = getFileId(file);

	if (localUrl.includes("/")) {
		const baseName = localUrl.substring(localUrl.lastIndexOf("/") + 1);
		if (evidenceId && baseName.startsWith(`${evidenceId}_`)) {
			return baseName.replace(`${evidenceId}_`, "");
		}
		return baseName;
	}

	if (file.name && file.name.includes(".")) {
		if (evidenceId && file.name.startsWith(`${evidenceId}_`)) {
			return file.name.replace(`${evidenceId}_`, "");
		}
		return file.name;
	}

	const mime = file.file_type || file.fileType || "";
	const ext = mime.includes("webp")
		? "webp"
		: mime.includes("pdf")
			? "pdf"
			: "jpg";

	return `${evidenceId}.${ext}`;
};

// Generates the exact compound key: userId/evidenceId_pickerName without duplicating IDs
const getRemotePath = (userId, file) => {
	const fileId = getFileId(file);
	const fileName = getFileName(file);

	// If the stored path already contains the full userId/fileId_filename format, use it directly
	const rawPath = file.local_file_url || file.cloud_file_url || "";
	if (rawPath.startsWith(`${userId}/${fileId}_`)) {
		return rawPath;
	}

	const targetPath = `${userId}/${fileId}_${fileName}`;
	return targetPath;
};

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

	const updateDownloadModal = (state) =>
		setDownloadModalState((prev) => ({ ...prev, ...state }));

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
					<Text style={styles.subtitle}>
						Please select a valid record from the vault.
					</Text>
				</View>
			</MainLayout>
		);
	}

	const handleDownloadSingle = async (file) => {
		const evidenceId = getFileId(file);
		const localName = getFileName(file);

		if (!evidenceId) {
			Alert.alert("Error", "Could not identify the unique evidence item ID.");
			return;
		}

		const remotePath = getRemotePath(user.userId, file);

		updateDownloadModal({
			visible: true,
			loading: true,
			title: "Preparing Secure Download",
			message: `Fetching file from secure repository...`,
		});

		try {
			await downloadToDownloadsDirectory(remotePath, localName);
			updateDownloadModal({
				loading: false,
				title: "Download Complete",
				message: `"${localName}" has been successfully downloaded to your local device directory.`,
			});
		} catch (error) {
			console.error("Single download routine failed:", error);
			updateDownloadModal({
				loading: false,
				title: "Download Failed",
				message: "Failed to download item from storage vault.",
			});
		}
	};

	const handleDownloadAll = async () => {
		if (!evidenceItem.files?.length) {
			Alert.alert(
				"Empty Collection",
				"No files found to compile into a zip bundle.",
			);
			return;
		}

		const totalFiles = evidenceItem.files.length;

		updateDownloadModal({
			visible: true,
			loading: true,
			title: "Compiling ZIP Bundle",
			message: `Initializing download queue for ${totalFiles} records...`,
		});

		try {
			const filesToZip = [];

			for (let i = 0; i < totalFiles; i++) {
				const file = evidenceItem.files[i];
				const remotePath = getRemotePath(user.userId, file);
				const localName = getFileName(file);

				updateDownloadModal({
					message: `Fetching file ${i + 1} of ${totalFiles}: ${localName}...`,
				});

				filesToZip.push({ remotePath, localName });
			}

			updateDownloadModal({
				message: `Compressing and packaging ${totalFiles} assets into archive folder...`,
			});

			const cleanBannerDate = (evidenceItem.date || "Evidence").replace(
				/[^a-zA-Z0-9]/g,
				"_",
			);
			const zipFileName = `Evidence_Bundle_${cleanBannerDate}.zip`;

			await downloadFilesAsZip(filesToZip, zipFileName);

			updateDownloadModal({
				loading: false,
				title: "ZIP Bundle Downloaded",
				message: `Successfully assembled and saved "${zipFileName}" into your native downloads folder.`,
			});
		} catch (error) {
			console.error("ZIP pipeline initialization sequence failed:", error);
			updateDownloadModal({
				loading: false,
				title: "Zip Export Failed",
				message: "Failed to assemble compressed asset package folder bundle.",
			});
		}
	};

	const confirmDeleteFile = async () => {
		const fileId = fileToDelete?.evidence_id || fileToDelete?.evidenceId;
		const userId = user?.userId || user?.user_id;

		if (!db || !fileId || !userId) {
			Alert.alert("Error", "Missing required parameters for deletion.");
			return;
		}

		try {
			setIsDeleting(true);
			await deleteEvidence(db, fileId, userId);
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
						<Text style={styles.bannerSubtitle}>Added On</Text>
						<Text style={styles.bannerTitle}>{evidenceItem.date}</Text>
					</View>
					<View style={styles.badgeContainer}>
						<Text style={styles.badgeText}>
							{evidenceItem.files.length} Files
						</Text>
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

			<DownloadModal
				visible={downloadModalState.visible}
				title={downloadModalState.title}
				message={downloadModalState.message}
				loading={downloadModalState.loading}
				onClose={() => updateDownloadModal({ visible: false })}
			/>
		</MainLayout>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
		marginTop: 100,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#111827",
		marginTop: 20,
		marginBottom: 8,
	},
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
	bannerSubtitle: {
		fontSize: 13,
		color: "#6B7280",
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	bannerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#111827",
		marginTop: 4,
	},
	badgeContainer: {
		backgroundColor: "#E9D5FF",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	badgeText: { color: "#6B21A8", fontWeight: "bold", fontSize: 12 },
	sectionHeader: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#374151",
		marginBottom: 14,
		paddingHorizontal: 4,
	},
});
