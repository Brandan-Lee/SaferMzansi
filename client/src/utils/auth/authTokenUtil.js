import * as SecureStore from "expo-secure-store";
import { decode as base64Decode } from "base-64";
import { STORAGE_KEYS } from "@constants/storageKeys";

export const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
export const OFFLINE_TOKEN_PREFIX = "offline_token_";

export const isOfflineToken = (token) =>
	typeof token === "string" && token.startsWith(OFFLINE_TOKEN_PREFIX);

// Offline tokens only identify the local account; they cannot authenticate API calls.
export const getOfflineUserId = (token) => {
	if (!isOfflineToken(token)) return null;
	return token.slice(OFFLINE_TOKEN_PREFIX.length) || null;
};

export const saveToken = async (token) => {
	const rawToken =
		typeof token === "object" && token !== null
			? token.token || token.accessToken
			: token;

	if (typeof rawToken !== "string" || !rawToken.trim()) {
		throw new Error("A valid authentication token is required.");
	}

	const normalizedToken = rawToken.trim();
	const isJwt = normalizedToken.split(".").length === 3;
	if (!isJwt && !isOfflineToken(normalizedToken)) {
		throw new Error("The authentication token format is not supported.");
	}

	await SecureStore.setItemAsync(TOKEN_KEY, normalizedToken);
};

export const parseJwt = (token) => {
	try {
		if (typeof token !== "string" || isOfflineToken(token)) return null;
		const parts = token.split(".");
		if (parts.length !== 3 || !parts[1]) return null;

		let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		while (base64.length % 4) base64 += "=";

		const decoded = base64Decode(base64);
		const jsonPayload = decodeURIComponent(
			decoded
				.split("")
				.map((character) =>
					`%${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
				)
				.join(""),
		);

		return JSON.parse(jsonPayload);
	} catch (error) {
		console.warn("Failed to parse JWT token:", error);
		return null;
	}
};

export const isTokenExpired = (token) => {
	const decoded = parseJwt(token);
	if (!decoded || !Number.isFinite(decoded.exp)) return true;
	return decoded.exp <= Math.floor(Date.now() / 1000);
};

export const getAuthToken = async () => {
	try {
		return await SecureStore.getItemAsync(TOKEN_KEY);
	} catch (error) {
		console.error("Failed to read the authentication token:", error);
		return null;
	}
};

export const removeAuthToken = async () => {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
};
