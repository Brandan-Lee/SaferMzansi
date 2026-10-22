import CryptoJS from "crypto-js";
import * as FileSystem from "expo-file-system/legacy";

const AES_SECRET_KEY = process.env.EXPO_PUBLIC_AES_256_SECRET_KEY;

const requireEncryptionKey = () => {
	if (!AES_SECRET_KEY) {
		throw new Error("The application encryption key is not configured.");
	}
	return AES_SECRET_KEY;
};

export const generateBlindIndex = (email) => {
	if (!email) throw new Error("An email is needed to generate a blind email index.");

	const normalizedEmail = email.trim().toLowerCase();
	return CryptoJS.HmacSHA256(normalizedEmail, requireEncryptionKey()).toString(
		CryptoJS.enc.Hex,
	);
};

export const encryptData = (plainText) => {
	if (!plainText) {
		return null;
	}

	return CryptoJS.AES.encrypt(plainText, requireEncryptionKey()).toString();
};

export const decryptData = (cipherText) => {
	if (!cipherText) {
		return null;
	}

	const bytes = CryptoJS.AES.decrypt(cipherText, requireEncryptionKey());
	return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptPayload = (payload) => {
	return Object.entries(payload).reduce((acc, [key, val]) => {
		acc[key] = encryptData(val);
		return acc;
	}, {});
};

export const hashFileSHA256 = async (fileUri) => {
	try {
		if (typeof fileUri !== "string" || !fileUri.trim()) {
			throw new Error("A local file URI is required.");
		}

		// Read local files through Expo's filesystem API; fetch() treats file URIs as HTTP.
		const base64Contents = await FileSystem.readAsStringAsync(fileUri, {
			encoding: FileSystem.EncodingType.Base64,
		});
		const hash = CryptoJS.SHA256(CryptoJS.enc.Base64.parse(base64Contents));

		return hash.toString(CryptoJS.enc.Hex);
	} catch (error) {
		console.error("[Security Util] Failed to hash file with SHA-256:", error);
		throw new Error("Failed to generate SHA-256 file hash.");
	}
};
