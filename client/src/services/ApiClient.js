import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { isTokenExpired } from "../utils/auth/authTokenUtil";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "user_jwt_token";
const REQUEST_TIMEOUT_MS = 4000;

// Keeps server calls bounded so screens can recover promptly from slow networks.
export const postApi = async (endpoint, body) => {
	const controller = new AbortController();
	let timeoutId;
	const timeoutResponse = new Promise((resolve) => {
		timeoutId = setTimeout(() => {
			controller.abort();
			resolve({
				ok: false,
				status: 0,
				data: null,
				error: "The request timed out. Please try again.",
			});
		}, REQUEST_TIMEOUT_MS);
	});

	const request = async () => {
		const token = await SecureStore.getItemAsync(TOKEN_KEY);
		const network = await NetInfo.fetch();
		if (controller.signal.aborted) {
			return {
				ok: false,
				status: 0,
				data: null,
				error: "The request timed out. Please try again.",
			};
		}
		if (
			network.isConnected === false ||
			network.isInternetReachable === false
		) {
			return {
				ok: false,
				status: 0,
				data: null,
				error: "Network connection failed",
			};
		}

		// Verify the offline JWT token before sending protected requests.
		if (token && !endpoint.includes("/users") && isTokenExpired(token)) {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			throw new Error(
				"Your session has expired. Please log in again when online",
			);
		}

		try {
		// POST call
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
				error: controller.signal.aborted
					? "The request timed out. Please try again."
					: "Network connection failed",
			};
		}
	};

	try {
		return await Promise.race([
			request().catch((error) => ({
				ok: false,
				status: 0,
				data: null,
				error: error.message || "Network connection failed",
			})),
			timeoutResponse,
		]);
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
