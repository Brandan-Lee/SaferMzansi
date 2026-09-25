import * as SecureStore from "expo-secure-store";
import { isTokenExpired } from "../utils/SecurityUtil";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "user_jwt_token";

export const postApi = async (endpoint, body) => {
	const token = await SecureStore.getItemAsync(TOKEN_KEY);

	//Verify if the users offline JWT token has expired or not
	if (token && !endpoint.includes("/users") && isTokenExpired(token)) {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		throw new Error("Your session has expired. Please log in again when online");
	}
	
	try {
		const response = await fetch(`${API_URL}${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		const rawText = await response.text();
3
		try {
			const data = JSON.parse(rawText);
			return {
				ok: response.ok,
				status: response.status,
				data,
			};
		} catch {
			console.error(
				`Server returned non-JSON response (${response.status}):`,
				rawText,
			);
			return {
				ok: false,
				status: response.status,
				data: null,
				error: `Server error (HTTP ${response.status})`,
			};
		}
	} catch (networkError) {
		console.warn("Network request failed:", networkError.message);
		return {
			ok: false,
			status: 0,
			data: null,
			error: "Network connection failed",
		};
	}
};
