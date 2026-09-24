import {
	createContext,
	useState,
	useContext,
	useCallback,
	useMemo,
} from "react";
import { useSQLiteContext } from "expo-sqlite";
import { registerUser } from "../services/UserService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const db = useSQLiteContext();
	const [user, setUser] = useState(null);
	const [sessionToken, setSessionToken] = useState(null);
	const [loading, setLoading] = useState(false);

	// Async function to register the user
	const register = useCallback(
		async (userData) => {
			setLoading(true);

			//Try to register the user with the UserService service
			try {
				const result = await registerUser(db, userData);

				if (result && result.token) {
					setSessionToken(result.token);
					setUser({ userId: result.userId, email: result.email });
				}

				return result;
			} finally {
				setLoading(false);
			}
		},
		[db],
	);

	const value = useMemo(
		() => ({
			user,
			sessionToken,
			loading,
			register,
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