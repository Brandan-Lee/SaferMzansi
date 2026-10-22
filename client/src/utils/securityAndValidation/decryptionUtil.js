import { decryptData } from "@utils/securityAndValidation/securityUtil";

// Older records may contain plain text, so keep the stored value if decryption fails.
export const decryptOrKeepValue = (cipherText, entityName, fieldName) => {
	if (!cipherText) return "";

	try {
		return decryptData(cipherText) || cipherText;
	} catch (error) {
		console.error(
			`Could not decrypt ${entityName} field ${fieldName}:`,
			error,
		);
		return cipherText;
	}
};
