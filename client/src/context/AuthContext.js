import {
	createContext,
	useState,
	useContext,
	useCallback,
	useMemo,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import { registerUser } from "../services/UserService";
import { loginUser } from "../services/UserService";
import { isTokenExpired } from "../utils/SecurityUtil";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "user_jwt_token";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const db = useSQLiteContext();
	const [user, setUser] = useState(null);
	const [sessionToken, setSessionToken] = useState(null);
	const [loading, setLoading] = useState(false);

	//Helper method to persist the authentication session
	const updateSession = useCallback((token, userData) => {
		setSessionToken(token || null);
		setUser(
			userData
				? {
						userId: userData.userId,
						email: userData.email,
					}
				: null,
		);
	}, []);

	//Method to help with the authentication action
	const handleAuthAction = useCallback(
		async (actionFn) => {
			setLoading(true);

			try {
				const result = await actionFn();

				if (result?.token) {
					updateSession(result.token, result);
				}

				return result;
			} finally {
				setLoading(false);
			}
		},
		[updateSession],
	);

	// Async function to register the user
	const register = useCallback(
		(userData) => handleAuthAction(() => registerUser(db, userData)),
		[db, handleAuthAction],
	);

	//Async function to log in the user
	const login = useCallback(
		({ email, password }) =>
			handleAuthAction(() => loginUser(db, email, password)),
		[db, handleAuthAction],
	);

	const checkAuthSession = async () => {
		const token = await SecureStore.getItemAsync(TOKEN_KEY);

		//The token doesn't exist or it has expired
		if (!token || isTokenExpired(token)) {
			console.log("Token is missing or expired. Clearing session.");
			await SecureStore.deleteItemAsync(TOKEN_KEY);
			return {
				isAuthenticated: false,
				user: null,
			};
		}

		return {
			isAuthenticated: true,
			token,
		};
	};

	const value = useMemo(
		() => ({
			user,
			sessionToken,
			loading,
			register,
			login,
			checkAuthSession,
			isAuthenticated: !!user,
		}),
		[user, sessionToken, loading, register],
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
