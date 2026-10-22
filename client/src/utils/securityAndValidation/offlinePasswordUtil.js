import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import CryptoJS from "crypto-js";
import { STORAGE_KEYS } from "@constants/storageKeys";

const VERIFIER_VERSION = "hmac-sha256-v1:";

// Store the HMAC key in the device keystore, not beside the SQLite verifier.
const getOrCreateVerifierKey = async () => {
	let key = await SecureStore.getItemAsync(STORAGE_KEYS.OFFLINE_PASSWORD_KEY);
	if (key) return key;

	const randomBytes = await Crypto.getRandomBytesAsync(32);
	key = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
	await SecureStore.setItemAsync(STORAGE_KEYS.OFFLINE_PASSWORD_KEY, key);
	return key;
};

export const createOfflinePasswordVerifier = async (password) => {
	if (!password) {
		throw new Error("A password is required to create offline credentials.");
	}

	const key = await getOrCreateVerifierKey();
	const digest = CryptoJS.HmacSHA256(password, key).toString(CryptoJS.enc.Hex);
	return `${VERIFIER_VERSION}${digest}`;
};

export const verifyOfflinePassword = async (password, storedVerifier) => {
	if (!password || !storedVerifier) {
		return { valid: false, upgradedVerifier: null };
	}

	if (storedVerifier.startsWith(VERIFIER_VERSION)) {
		const currentVerifier = await createOfflinePasswordVerifier(password);
		return {
			valid: currentVerifier === storedVerifier,
			upgradedVerifier: null,
		};
	}

	// Existing installations stored an unkeyed SHA-256 digest; migrate it after a
	// successful match so future offline checks use the protected verifier.
	const legacyDigest = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		password,
	);
	if (legacyDigest !== storedVerifier) {
		return { valid: false, upgradedVerifier: null };
	}

	return {
		valid: true,
		upgradedVerifier: await createOfflinePasswordVerifier(password),
	};
};
