import {
	createContext,
	useState,
	useContext,
	useCallback,
	useMemo,
	useEffect,
	useRef,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { loginUser, registerUser } from "@services/auth/authService";
import { syncOfflineChanges } from "@services/main/offlineSyncService";
import { restoreLocalAccountAfterLogin } from "@services/main/userService";
import { isTokenExpired } from "@utils/auth/authTokenUtil";
import { saveEmergencyUserId } from "@utils/storage/secureStore";

const TOKEN_KEY = "user_jwt_token";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const db = useSQLiteContext();
	const [user, setUser] = useState(null);
	const [sessionToken, setSessionToken] = useState(null);
	const [loading, setLoading] = useState(false);
	const [pendingAuthRoute, setPendingAuthRoute] = useState(null);
	const [pendingAuthParams, setPendingAuthParams] = useState(null);
	const isSyncingOfflineChanges = useRef(false);

	useEffect(() => {
		const syncWhenOnline = async (state) => {
			if (
				!state.isConnected ||
				state.isInternetReachable === false ||
				isSyncingOfflineChanges.current
			) {
				return;
			}

			isSyncingOfflineChanges.current = true;
			try {
				await syncOfflineChanges(db);
			} catch (error) {
				console.error("[Offline Sync] Failed to sync pending local changes:", error);
			} finally {
				isSyncingOfflineChanges.current = false;
			}
		};

		const unsubscribe = NetInfo.addEventListener(syncWhenOnline);
		NetInfo.fetch()
			.then(syncWhenOnline)
			.catch((error) =>
				console.error("[Offline Sync] Could not check network status:", error),
			);

		return unsubscribe;
	}, [db]);

	// Helper method to persist the authentication session upon successful login
	const updateSession = useCallback(async (token, userData) => {
		try {
			if (token) {
				await SecureStore.setItemAsync(TOKEN_KEY, token);
				setSessionToken(token);
			} else {
				await SecureStore.deleteItemAsync(TOKEN_KEY);
				setSessionToken(null);
			}

			setUser(
				userData
					? {
						userId: userData.userId,
						email: userData.email,
						userName: userData.userName,
						userSurname: userData.userSurname,
						userNumber: userData.userNumber,
					}
					: null,
			);

			if (userData?.userId) {
				saveEmergencyUserId(userData.userId).catch((error) => {
					console.error("Failed to save the local emergency profile:", error);
				});
			}
		} catch (error) {
			console.error("Failed to update session storage:", error);
		}
	}, []);

	const register = useCallback(
		async (userData) => {
			setLoading(true);
			try {
				const result = await registerUser(db, userData);

				if (result?.token) {
					await SecureStore.setItemAsync(TOKEN_KEY, result.token);
				}

				return result;
			} finally {
				setLoading(false);
			}
		},
		[db],
	);

	// Async function to log in the user
	const login = useCallback(
		async ({ email, password }) => {
			setLoading(true);
			try {
				const result = await loginUser(db, email, password);

				if (result?.token && result?.userId) {
					const isSoftDeleted = result.is_deleted || result.deleted_at;

					if (isSoftDeleted) {
						console.log("[Auth] Reactivated account detected. Clearing local soft-delete state...");

						await restoreLocalAccountAfterLogin(db, result.userId);
					}

					await SecureStore.setItemAsync(TOKEN_KEY, result.token);
				}

				return result;
			} finally {
				setLoading(false);
			}
		},
		[db],
	);

	// Optional manually triggered method if needed elsewhere in the app
	const checkAuthSession = useCallback(async () => {
		try {
			const token = await SecureStore.getItemAsync(TOKEN_KEY);

			if (!token || isTokenExpired(token)) {
				await SecureStore.deleteItemAsync(TOKEN_KEY);
				setSessionToken(null);
				setUser(null);
				return { isAuthenticated: false, user: null };
			}

			setSessionToken(token);
			return { isAuthenticated: true, token };
		} catch (error) {
			console.error("Error checking auth session:", error);
			return { isAuthenticated: false, user: null };
		}
	}, []);

	// Logout clears state and SecureStore
	const logOut = useCallback(async (nextRoute = null, nextParams = null) => {
		setLoading(true);
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			setPendingAuthRoute(nextRoute);
			setPendingAuthParams(nextParams);
			setSessionToken(null);
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	const value = useMemo(
		() => ({
			user,
			sessionToken,
			loading,
			register,
			login,
			logOut,
			updateSession,
			checkAuthSession,
			isAuthenticated: !!sessionToken,
			pendingAuthParams,
			pendingAuthRoute,
		}),
		[user, sessionToken, loading, register, login, logOut, checkAuthSession],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
};
