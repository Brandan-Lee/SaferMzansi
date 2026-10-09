import * as SecureStore from "expo-secure-store";
import { decode as base64Decode } from "base-64";

const TOKEN_KEY = "user_jwt_token";

//Helper method to save the JWT token
export const saveToken = async (token) => {
    if (!token) {
        return;
    }
    
    //Ensure that the token type is correct
    const rawToken =
        typeof token === "object" ? token.token || token.accessToken : token;

    //Store the token inside the hardware secured storage of the device
    if (typeof rawToken === "string" && rawToken.includes(".")) {
        await SecureStore.setItemAsync(TOKEN_KEY, rawToken.trim());
    } else {
        console.warn(
            "Skipping token save: Provided token is not a valid JWT format",
            token,
        );
    }
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

//Method to check if the JWT token is expired or not
export const isTokenExpired = (token) => {
	const decoded = parseJwt(token);

	if (!decoded || !decoded.exp) {
		return true;
	}

	const currentTimeInSeconds = Math.floor(Date.now() / 1000);
	return decoded.exp < currentTimeInSeconds;
};

//Method to retrieve the JWT token from hardware secured storage
export const getAuthToken = async () => {
    try {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
        return null;
    }
}

//Method to remove the JWT token from hardware secured storage
export const removeAuthToken = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
} 
