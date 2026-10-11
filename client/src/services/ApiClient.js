import * as SecureStore from "expo-secure-store";
import { isTokenExpired } from "../utils/auth/authTokenUtil";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "user_jwt_token";
const REQUEST_TIMEOUT_MS = 15000;

//Helper service method that allows easier endpoint creation
export const postApi = async (endpoint, body) => {
	const token = await SecureStore.getItemAsync(TOKEN_KEY);

	//Verify if the users offline JWT token has expired or not
	if (token && !endpoint.includes("/users") && isTokenExpired(token)) {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		throw new Error(
			"Your session has expired. Please log in again when online",
		);
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		//POST Call
		const response = await fetch(`${API_URL}${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		const rawText = await response.text();
		try {
			//Retrieve the data from the response and convert it into JSON
			const data = JSON.parse(rawText);
			return {
				ok: response.ok,
				status: response.status,
				data,
			};
		} catch {
			//There was an error
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
		//There was an error calling the server
		console.warn("Network request failed:", networkError.message);
		return {
			ok: false,
			status: 0,
			data: null,
			error:
				controller.signal.aborted
					? "The request timed out. Please try again."
					: "Network connection failed",
		};
	} finally {
		clearTimeout(timeoutId);
	}
};

//Method that provides a safe api call to the server
export const safeApiCall = async (apiFunction, fallbackErrorMessage) => {
	try {
		const response = await apiFunction();

		//Error occurred
		if (!response || response.error || response.ok === false) {
			return {
				success: false,
				status: response?.status,
				data: response?.data,
				error: response?.data?.error || response?.error || fallbackErrorMessage,
			};
		}

		const payload = response.data?.data !== undefined ? response.data.data : response.data;

		//Successful response
		return {
			success: true,
			data: response.data || payload,
		};
	} catch (err) {
		//All around error
		return {
			success: false,
			error: err.message || fallbackErrorMessage,
		};
	}
};
