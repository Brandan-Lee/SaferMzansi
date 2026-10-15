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

export const hashFileSHA256 = async (fileUri) => {
	try {
		const response = await fetch(fileUri);
		const arrayBuffer = await response.arrayBuffer();

		const byteArray = new Uint8Array(arrayBuffer);
		let binaryString = "";
		const chunkSize = 8192;

		for (let i = 0; i < byteArray.length; i += chunkSize) {
			const chunk = byteArray.subarray(i, i + chunkSize);
			binaryString += String.fromCharCode.apply(null, chunk);
		}

		const wordArray = CryptoJS.enc.Latin1.parse(binaryString);
		const hash = CryptoJS.SHA256(wordArray);

		return hash.toString(CryptoJS.enc.Hex);
	} catch (error) {
		console.error("[Security Util] Failed to hash file with SHA-256:", error);
		throw new Error("Failed to generate SHA-256 file hash.");
	}
};
