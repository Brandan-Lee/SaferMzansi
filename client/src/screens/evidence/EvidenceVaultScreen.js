import React, { useState, useCallback } from "react";
import {
	StyleSheet,
	Text,
	View,
	Alert,
	ActivityIndicator,
	FlatList,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { useAuth } from "@context/AuthContext";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import MainLayout from "@components/layouts/MainLayout";
import EvidenceCard from "@components/evidence/EvidenceCard";
import { addEvidence, getEvidence } from "@services/main/evidenceService";

const PURPLE = "#6B21A8";

//Format bytes to readable size
const formatFileSize = (bytes) => {
	if (!bytes) return "Encrypted file";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

//Process picked file asset details
const processFileAsset = (fileAsset) => {
	const mimeType = fileAsset.mimeType || "";
	let type = "file";
	let icon = "file";

	if (mimeType.startsWith("image/")) {
		type = "image";
	} else if (mimeType.startsWith("video/")) {
		type = "video";
	} else if (mimeType.startsWith("audio/")) {
		type = "audio";
		icon = "mic";
	} else if (mimeType.includes("pdf")) {
		type = "pdf";
		icon = "file-text";
	}

	return {
		type,
		icon,
		uri: fileAsset.uri,
		name: fileAsset.name || "Evidence File",
		sizeFormatted: formatFileSize(fileAsset.size),
		size: fileAsset.size || 0,
		mimeType,
	};
};

export default function EvidenceVaultScreen({ navigation }) {
	const db = useSQLiteContext();
	const { user } = useAuth();

	const [uploading, setUploading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [evidenceItems, setEvidenceItems] = useState([]);
	const [banner, setBanner] = useState(null);

	const loadEvidence = useCallback(async () => {
		if (!db || !user.userId) return setLoading(false);
		try {
			setLoading(true);
			setBanner(null);
			const res = await getEvidence(db, user.userId, { grouped: true });
			setEvidenceItems(res?.data || []);
		} catch (error) {
			console.error("[Evidence Vault] Failed to load local evidence:", error);
			setEvidenceItems([]);
		} finally {
			setLoading(false);
		}
	}, [db, user.userId]);

	useFocusEffect(
		useCallback(() => {
			loadEvidence();
		}, [loadEvidence]),
	);

	const selectAndBackupFile = async () => {
		if (uploading || !db || !user.userId) return;

		try {
			setUploading(true);
			setBanner(null);
			const result = await DocumentPicker.getDocumentAsync({
				type: ["application/pdf", "image/*", "video/*", "audio/*"],
				copyToCacheDirectory: false,
				multiple: true,
			});

			if (result.canceled || !result.assets?.length) return;

			for (const fileAsset of result.assets) {
				const processed = processFileAsset(fileAsset);
				await addEvidence(db, user.userId, {
					file_type: processed.mimeType || "application/octet-stream",
					local_file_url: fileAsset.uri,
					file_size: processed.size,
					file_name: fileAsset.name,
				});
			}

			await loadEvidence();
			setBanner({
				message: `Added ${result.assets.length} file(s) to the local vault.`,
				type: "success",
			});
		} catch (error) {
			console.error("Picker error detailed log: ", error);
			setBanner({
				message: "An issue occurred while picking your file.",
				type: "error",
			});
		} finally {
			setUploading(false);
		}
	};

	return (
		<MainLayout
			title="Evidence Vault"
			onBack={() => navigation.replace("HomeScreen")}
			banner={banner}
			tab="Vault"
			navigation={navigation}
			actionButton={{
				label: uploading ? "Uploading..." : "Upload",
				icon: "cloud-upload-outline",
				onPress: selectAndBackupFile,
			}}
		>
			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator size="large" color={PURPLE} />
				</View>
			) : (
				<FlatList
					data={evidenceItems}
					keyExtractor={(item, index) =>
						item.id?.toString() || index.toString()
					}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Feather name="alert-circle" size={80} color="#2D1638" />
							<Text style={styles.emptyTitle}>Nothing uploaded yet</Text>
							<Text style={styles.emptySubtitle}>
								Everything uploaded here{"\n"}is encrypted locally.
							</Text>
						</View>
					}
					renderItem={({ item }) => (
						<EvidenceCard
							item={item}
							onPress={() =>
								navigation.replace("EvidenceVaultDetailsScreen", {
									evidenceItem: item,
								})
							}
						/>
					)}
				/>
			)}
		</MainLayout>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	list: { gap: 16, paddingBottom: 20, marginTop: 20 },
	emptyContainer: {
		justifyContent: "center",
		alignItems: "center",
		marginTop: 60,
		paddingHorizontal: 20,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#111827",
		textAlign: "center",
		marginTop: 20,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 15,
		lineHeight: 22,
		color: "#555",
		textAlign: "center",
	},
});
