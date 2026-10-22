import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@config/supabase_client";

const PURPLE = "#6B21A8";

// Resolve stored object keys only when a signed preview URL is needed.
export default function EvidenceFilePreview({ file, size = 52 }) {
	const [resolvedUri, setResolvedUri] = useState("");
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		let isMounted = true;
		setResolvedUri("");
		setImageFailed(false);

		const resolveUri = async () => {
			const localUri = file?.uri || file?.local_file_url;
			const cloudPath = file?.cloud_file_url || file?.cloudFileUrl;
			const localUriCanDisplay =
				localUri &&
				(localUri.startsWith("file://") ||
					localUri.startsWith("content://") ||
					localUri.startsWith("http"));

			if (localUriCanDisplay) {
				if (isMounted) setResolvedUri(localUri);
				return;
			}

			const remotePath = cloudPath || localUri;
			if (!remotePath) return;
			if (remotePath.startsWith("http")) {
				if (isMounted) setResolvedUri(remotePath);
				return;
			}

			const { data, error } = await supabase.storage
				.from("EvidenceVault")
				.createSignedUrl(remotePath, 300);
			if (error) throw error;
			if (isMounted && data?.signedUrl) setResolvedUri(data.signedUrl);
		};

		resolveUri().catch((error) => {
			console.error("Could not load evidence preview:", error);
		});

		return () => {
			isMounted = false;
		};
	}, [file]);

	const isImage =
		file?.type === "image" ||
		(file?.file_type || file?.mimeType || file?.fileType || "").startsWith(
			"image/",
		);

	const handleImageError = async () => {
		const cloudPath = file?.cloud_file_url || file?.cloudFileUrl;
		if (!cloudPath || cloudPath === resolvedUri || cloudPath.startsWith("http")) {
			setImageFailed(true);
			return;
		}

		const { data, error } = await supabase.storage
			.from("EvidenceVault")
			.createSignedUrl(cloudPath, 300);
		if (error) {
			console.error("Could not load evidence preview:", error);
			setImageFailed(true);
			return;
		}
		if (data?.signedUrl && data.signedUrl !== resolvedUri) {
			setResolvedUri(data.signedUrl);
		} else {
			setImageFailed(true);
		}
	};

	if (isImage && resolvedUri && !imageFailed) {
		return (
			<Image
				source={{ uri: resolvedUri }}
				style={[styles.preview, { width: size, height: size }]}
				accessibilityLabel="Evidence image preview"
				onError={handleImageError}
			/>
		);
	}

	const fileType = file?.type || file?.file_type || file?.mimeType || "";
	const icon =
		file?.icon ||
		(fileType.startsWith("video/") || fileType === "video"
			? "video"
			: fileType.startsWith("audio/") || fileType === "audio"
				? "mic"
				: fileType.includes("pdf") || fileType === "pdf"
					? "file-text"
					: "file");

	return (
		<View
			style={[
				styles.placeholder,
				{ width: size, height: size, borderRadius: Math.round(size * 0.22) },
			]}
		>
			<Feather name={icon} size={Math.round(size * 0.42)} color={PURPLE} />
		</View>
	);
}

const styles = StyleSheet.create({
	preview: { borderRadius: 12, resizeMode: "cover" },
	placeholder: {
		backgroundColor: "#F3E8FF",
		alignItems: "center",
		justifyContent: "center",
	},
});
