import CryptoJS from "crypto-js";
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
		if (!token) {
			return null;
		}

		const basae64url = token.split(".")[1];

		if (!basae64url) {
			return null;
		}

		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join(),
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
