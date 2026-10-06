import {
	createContext,
	useState,
	useContext,
	useCallback,
	useMemo,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { loginUser, registerUser } from "@services/auth/authService";
import { isTokenExpired } from "@utils/auth/authTokenUtil";

const TOKEN_KEY = "user_jwt_token";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const db = useSQLiteContext();
	const [user, setUser] = useState(null);
	const [sessionToken, setSessionToken] = useState(null);
	const [loading, setLoading] = useState(false);

	// Helper method to persist the authentication session upon successful login
	const updateSession = useCallback((token, userData) => {
		setSessionToken(token || null);
		setUser(
			userData
				? {
						userId: userData.userId,
						email: userData.email,
						userName: userData.userName,
					}
				: null,
		);
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

				return result;
			} finally {
				setLoading(false);
			}
		},
		[db, updateSession],
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
	const logout = useCallback(async () => {
		setLoading(true);
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY);
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
			logout,
			updateSession,
			checkAuthSession,
			isAuthenticated: !!sessionToken,
		}),
		[user, sessionToken, loading, register, login, logout, checkAuthSession],
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
