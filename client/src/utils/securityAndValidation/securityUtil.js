import CryptoJS from "crypto-js";
const AES_SECRET_KEY = process.env.EXPO_PUBLIC_AES_256_SECRET_KEY;

export const generateBlindIndex = (email) => {
	if (!email) {
		return new Error("An email is needed to generate a blind email index");
	}

	const normalizedEmail = email.trim().toLowerCase();
	return CryptoJS.HmacSHA256(normalizedEmail, AES_SECRET_KEY).toString(
		CryptoJS.enc.Hex,
	);
};

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
