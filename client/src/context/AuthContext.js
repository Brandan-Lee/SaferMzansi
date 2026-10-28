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
import NetInfo from "@react-native-community/netinfo";
import { loginUser, registerUser } from "@services/auth/authService";
import {
	syncOfflineChanges,
	syncPendingUserProfile,
} from "@services/main/offlineSyncService";
import {
	getLocalUserDetails,
	restoreLocalAccountAfterLogin,
} from "@services/main/userService";
import {
	getAuthToken,
	getOfflineUserId,
	isOfflineToken,
	isTokenExpired,
	parseJwt,
	removeAuthToken,
	saveToken,
} from "@utils/auth/authTokenUtil";
import { saveEmergencyUserId } from "@utils/storage/secureStore";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const db = useSQLiteContext();
	const [user, setUser] = useState(null);
	const [sessionToken, setSessionToken] = useState(null);
	const [hasActiveLogin, setHasActiveLogin] = useState(false);
	const [loading, setLoading] = useState(false);
	const [pendingAuthRoute, setPendingAuthRoute] = useState(null);
	const [pendingAuthParams, setPendingAuthParams] = useState(null);
	const isSyncingOfflineChanges = useRef(false);

	const setSession = useCallback((token, userData) => {
		setSessionToken(token);
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
	}, []);

	useEffect(() => {
		const syncWhenOnline = async (state) => {
			if (
				!sessionToken ||
				isOfflineToken(sessionToken) ||
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
	}, [db, sessionToken]);

	// Keep the current account in memory after the auth service returns.
	const updateSession = useCallback((token, userData) => {
		if (token) {
			setSession(token, userData);
			setHasActiveLogin(true);
		} else {
			setSession(null, null);
			setHasActiveLogin(false);
		}

		if (userData?.userId) {
			saveEmergencyUserId(userData.userId).catch((error) => {
				console.error("Failed to save the local emergency profile:", error);
			});
		}
	}, [setSession]);

	const register = useCallback(
		async (userData) => {
			setLoading(true);
			try {
				const result = await registerUser(db, userData);

				if (result?.token) {
					await saveToken(result.token);
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
					const isSoftDeleted =
						result.user?.is_deleted || result.user?.deleted_at;

					if (isSoftDeleted) {
						await restoreLocalAccountAfterLogin(db, result.userId);
					}

					await saveToken(result.token);
					if (!isOfflineToken(result.token)) {
						try {
							const profileSynced = await syncPendingUserProfile(
								db,
								result.userId,
							);
							if (!profileSynced) {
								console.warn(
									"[Auth] Saved profile changes are still pending server sync.",
								);
							}
						} catch (error) {
							console.error(
								"[Auth] Failed to sync pending profile changes after login:",
								error,
							);
						}
					}
				}

				return result;
			} finally {
				setLoading(false);
			}
		},
		[db],
	);

	// Restore either a server session or a locally verified offline session.
	const checkAuthSession = useCallback(async () => {
		try {
			const token = await getAuthToken();
			if (!token) {
				setSession(null, null);
				return { isAuthenticated: false, user: null };
			}

			const userId = isOfflineToken(token)
				? getOfflineUserId(token)
				: parseJwt(token)?.userId;

			if (isTokenExpired(token) && !isOfflineToken(token)) {
				await removeAuthToken();
				setSession(null, null);
				return { isAuthenticated: false, user: null };
			}

			const localUser = userId ? await getLocalUserDetails(db, userId) : null;
			if (isOfflineToken(token) && !localUser) {
				await removeAuthToken();
				setSession(null, null);
				return { isAuthenticated: false, user: null };
			}

			const restoredUser = localUser
				? {
						userId: localUser.user_id,
						email: localUser.email,
						userName: localUser.encrypted_name,
						userSurname: localUser.encrypted_surname,
						userNumber: localUser.encrypted_phone_num,
					}
				: null;
			setSession(token, restoredUser);
			return { isAuthenticated: true, token, user: restoredUser };
		} catch (error) {
			console.error("Error checking auth session:", error);
			return { isAuthenticated: false, user: null };
		}
	}, [db, setSession]);

	// Logout clears state and SecureStore
	const logOut = useCallback(async (nextRoute = null, nextParams = null) => {
		setLoading(true);
		try {
			await removeAuthToken();
			setPendingAuthRoute(nextRoute);
			setPendingAuthParams(nextParams);
			setSession(null, null);
			setHasActiveLogin(false);
		} finally {
			setLoading(false);
		}
	}, [setSession]);

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
			hasActiveLogin,
			pendingAuthParams,
			pendingAuthRoute,
		}),
		[
			user,
			sessionToken,
			loading,
			hasActiveLogin,
			register,
			login,
			logOut,
			checkAuthSession,
			updateSession,
			pendingAuthRoute,
			pendingAuthParams,
		],
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
