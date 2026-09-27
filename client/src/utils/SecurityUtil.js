import CryptoJS from "crypto-js";
import { decode as base64Decode } from "base-64";
const AES_SECRET_KEY = process.env.EXPO_PUBLIC_AES_256_SECRET_KEY;

// Method to encrypt data with AES-256 encryption
export const encryptData = (plainText) => {
	if (!plainText) {
		return null;
	}

	return CryptoJS.AES.encrypt(plainText, AES_SECRET_KEY).toString();
};

// Method to decrypt data with AES-256 decryption
export const decryptData = (cipherText) => {
	if (!cipherText) {
		return null;
	}

	const bytes = CryptoJS.AES.decrypt(cipherText, AES_SECRET_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
};

//Method to encrypt the payload before sending it to the node.js server
export const encryptPayload = (payload) => {
	return Object.entries(payload).reduce((acc, [key, val]) => {
		acc[key] = encryptData(val);
		return acc;
	}, {});
};

// Method to hash the password with sha-256
export const hashPassword = (password) => {
	if (!password) {
		return "";
	}

	return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
};

export const parseJwt = (token) => {
    try {
        if (!token || typeof token !== "string") {
            return null;
        }

        const base64url = token.split(".")[1];

        if (!base64url) {
            return null;
        }

        // Convert Base64URL to standard Base64
        let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

        // Pad string to a multiple of 4
        while (base64.length % 4) {
            base64 += "=";
        }

        // Decode Base64 string safely in Hermes / Expo environment
        const decoded = base64Decode(base64);

        // Escape and decode URI components safely
        const jsonPayload = decodeURIComponent(
            decoded
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.warn("Failed to parse JWT token:", error);
        return null;
    }
};

export const isTokenExpired = (token) => {
	const decoded = parseJwt(token);

	if (!decoded || !decoded.exp) {
		return true;
	}

	const currentTimeInSeconds = Math.floor(Date.now() / 1000);
	return decoded.exp < currentTimeInSeconds;
};
