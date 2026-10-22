import * as FileSystem from "expo-file-system/legacy";
import { StorageAccessFramework } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { supabase } from "@config/supabase_client";
import JSZip from "jszip";
import { Buffer } from "buffer";

const EVIDENCE_BUCKET = "EvidenceVault";
const MIME_TYPES = {
	zip: "application/zip",
	file: "application/octet-stream",
};

const sanitizeFileName = (name) => {
	const safeName = String(name || "evidence")
		.replace(/[\\/:*?"<>|]/g, "_")
		.trim();
	return safeName && safeName !== "." && safeName !== ".."
		? safeName
		: "evidence";
};

const cleanupFiles = async (paths) => {
	const results = await Promise.allSettled(
		paths.map((path) =>
			FileSystem.deleteAsync(path, { idempotent: true }),
		),
	);
	results.forEach((result) => {
		if (result.status === "rejected") {
			console.warn("[Evidence Download] Could not remove a temporary file.");
		}
	});
};

const getDownloadUrl = async (filePath) => {
	if (typeof filePath !== "string" || !filePath.trim()) {
		throw new Error("A valid evidence file path is required.");
	}

	if (filePath.startsWith("https://")) return filePath;
	if (filePath.startsWith("http://")) {
		throw new Error("Evidence downloads must use a secure HTTPS link.");
	}

	const { data, error } = await supabase.storage
		.from(EVIDENCE_BUCKET)
		.createSignedUrl(filePath, 60);
	if (error) throw error;
	if (!data?.signedUrl) {
		throw new Error("The evidence download link could not be created.");
	}
	return data.signedUrl;
};

const downloadEvidenceToTemporaryFile = async (
	filePath,
	temporaryUri,
	localFileUri,
) => {
	try {
		const signedUrl = await getDownloadUrl(filePath);
		return await FileSystem.downloadAsync(signedUrl, temporaryUri);
	} catch (error) {
		const isLocalUri =
			typeof localFileUri === "string" &&
			(localFileUri.startsWith("file://") ||
				localFileUri.startsWith("content://"));
		if (!isLocalUri) throw error;

		const localFile = await FileSystem.getInfoAsync(localFileUri);
		if (!localFile.exists) throw error;
		await FileSystem.copyAsync({ from: localFileUri, to: temporaryUri });
		return { uri: temporaryUri };
	}
};

export const downloadToDownloadsDirectory = async (
	filePath,
	localFileName,
	localFileUri = null,
) => {
	const fileName = sanitizeFileName(localFileName);
	let temporaryUri = null;

	try {
		temporaryUri = `${FileSystem.documentDirectory}${Date.now()}_${fileName}`;
		const downloadResult = await downloadEvidenceToTemporaryFile(
			filePath,
			temporaryUri,
			localFileUri,
		);

		if (Platform.OS === "android") {
			const permissions =
				await StorageAccessFramework.requestDirectoryPermissionsAsync();
			if (!permissions.granted) {
				throw new Error("Folder access permission denied.");
			}

			const fileData = await FileSystem.readAsStringAsync(downloadResult.uri, {
				encoding: FileSystem.EncodingType.Base64,
			});
			const destinationUri = await StorageAccessFramework.createFileAsync(
				permissions.directoryUri,
				fileName,
				MIME_TYPES.file,
			);
			await FileSystem.writeAsStringAsync(destinationUri, fileData, {
				encoding: FileSystem.EncodingType.Base64,
			});
			return true;
		}

		if (!(await Sharing.isAvailableAsync())) {
			throw new Error("File sharing is not available on this device.");
		}
		await Sharing.shareAsync(downloadResult.uri, {
			UTI: "public.item",
			dialogTitle: "Save File",
		});
		return true;
	} catch (error) {
		console.error("[Evidence Download] Could not download the evidence file:", error);
		throw error;
	} finally {
		if (temporaryUri) await cleanupFiles([temporaryUri]);
	}
};

export const downloadFilesAsZip = async (
	files,
	zipFileName = "Evidence_Bundle.zip",
) => {
	if (!Array.isArray(files) || files.length === 0) {
		throw new Error("Select at least one evidence file to create a ZIP bundle.");
	}

	const zip = new JSZip();
	const temporaryPaths = [];
	let androidDirectoryUri = null;
	const usedNames = new Set();

	try {
		if (Platform.OS === "android") {
			const permissions =
				await StorageAccessFramework.requestDirectoryPermissionsAsync();
			if (!permissions.granted) {
				throw new Error("Folder access permission denied.");
			}
			androidDirectoryUri = permissions.directoryUri;
		} else if (!(await Sharing.isAvailableAsync())) {
			throw new Error("File sharing is not available on this device.");
		}

		for (const file of files) {
			const fileName = getUniqueFileName(file.localName, usedNames);
			const temporaryUri = `${FileSystem.documentDirectory}${Date.now()}_${fileName}`;
			temporaryPaths.push(temporaryUri);

			const downloadResult = await downloadEvidenceToTemporaryFile(
				file.remotePath,
				temporaryUri,
				file.localUri,
			);
			const base64Data = await FileSystem.readAsStringAsync(
				downloadResult.uri,
				{ encoding: FileSystem.EncodingType.Base64 },
			);
			zip.file(fileName, Buffer.from(base64Data, "base64"));
		}

		const zipBase64 = await zip.generateAsync({ type: "base64" });
		const safeZipName = sanitizeFileName(zipFileName);
		const zipUri = `${FileSystem.documentDirectory}${Date.now()}_${safeZipName}`;
		temporaryPaths.push(zipUri);
		await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
			encoding: FileSystem.EncodingType.Base64,
		});

		if (Platform.OS === "android") {
			const destinationUri = await StorageAccessFramework.createFileAsync(
				androidDirectoryUri,
				safeZipName,
				MIME_TYPES.zip,
			);
			await FileSystem.writeAsStringAsync(destinationUri, zipBase64, {
				encoding: FileSystem.EncodingType.Base64,
			});
		} else {
			await Sharing.shareAsync(zipUri, {
				UTI: "com.pkware.zip",
				dialogTitle: "Save Zip Bundle Archive",
			});
		}

		return true;
	} catch (error) {
		console.error("[Evidence Download] Could not create the ZIP bundle:", error);
		throw error;
	} finally {
		await cleanupFiles(temporaryPaths);
	}
};

const getUniqueFileName = (name, usedNames) => {
	const safeName = sanitizeFileName(name);
	if (!usedNames.has(safeName)) {
		usedNames.add(safeName);
		return safeName;
	}

	const extensionIndex = safeName.lastIndexOf(".");
	const hasExtension = extensionIndex > 0;
	const baseName = hasExtension ? safeName.slice(0, extensionIndex) : safeName;
	const extension = hasExtension ? safeName.slice(extensionIndex) : "";
	let index = 2;
	let uniqueName = `${baseName}_${index}${extension}`;
	while (usedNames.has(uniqueName)) {
		index += 1;
		uniqueName = `${baseName}_${index}${extension}`;
	}
	usedNames.add(uniqueName);
	return uniqueName;
};
