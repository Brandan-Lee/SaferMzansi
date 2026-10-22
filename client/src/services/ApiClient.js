import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { API_BASE_URL } from "@config/config";
import {
	isOfflineToken,
	isTokenExpired,
	removeAuthToken,
} from "@utils/auth/authTokenUtil";
import { STORAGE_KEYS } from "@constants/storageKeys";

const REQUEST_TIMEOUT_MS = 4000;
const TIMEOUT_ERROR = "The request timed out. Please try again.";
const NETWORK_ERROR = "Network connection failed";
const AUTH_REQUIRED_ERROR =
	"Log in online before syncing changes from this device.";

const isPublicEndpoint = (endpoint) =>
	endpoint.startsWith("/auth/login") ||
	endpoint.startsWith("/auth/register") ||
	endpoint.startsWith("/auth/forgot-password") ||
	endpoint.startsWith("/auth/reset-password") ||
	endpoint.startsWith("/otp/");

const createRequestError = (error) => ({
	ok: false,
	status: 0,
	data: null,
	error,
});

// Normal API calls time out quickly; urgent calls can opt out when needed.
export const postApi = async (
	endpoint,
	body,
	{ timeoutMs = REQUEST_TIMEOUT_MS } = {},
) => {
	const controller = new AbortController();
	let timeoutId;

	const request = async () => {
		if (!API_BASE_URL) {
			throw new Error("The API base URL is not configured.");
		}

		const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
		const network = await NetInfo.fetch();
		if (controller.signal.aborted) {
			return createRequestError(TIMEOUT_ERROR);
		}
		if (
			network.isConnected === false ||
			network.isInternetReachable === false
		) {
			return createRequestError(NETWORK_ERROR);
		}

		if (isOfflineToken(token) && !isPublicEndpoint(endpoint)) {
			return createRequestError(AUTH_REQUIRED_ERROR);
		}

		if (
			token &&
			!isPublicEndpoint(endpoint) &&
			isTokenExpired(token)
		) {
			await removeAuthToken();
			throw new Error(
				"Your session has expired. Please log in again when online",
			);
		}

		try {
		// POST call
			const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
			return createRequestError(
				controller.signal.aborted ? TIMEOUT_ERROR : NETWORK_ERROR,
			);
		}
	};

	try {
		const pendingRequest = request().catch((error) =>
			createRequestError(error.message || NETWORK_ERROR),
		);

		// A zero timeout lets an urgent request wait for the server's full response.
		if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
			return await pendingRequest;
		}

		const timeoutResponse = new Promise((resolve) => {
			timeoutId = setTimeout(() => {
				controller.abort();
				resolve({
					ok: false,
					status: 0,
					data: null,
					error: TIMEOUT_ERROR,
				});
			}, timeoutMs);
		});

		return await Promise.race([pendingRequest, timeoutResponse]);
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

		// Preserve the server's response envelope for callers that need metadata.
		return {
			success: true,
			data: response.data,
		};
	} catch (err) {
		//All around error
		return {
			success: false,
			error: err.message || fallbackErrorMessage,
		};
	}
};
