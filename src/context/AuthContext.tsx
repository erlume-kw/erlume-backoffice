import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { getToken, getUser, setAuth, clearAuth, type AuthUser } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-config";

interface AuthContextValue {
	token: string | null;
	user: AuthUser | null;
	isAuthenticated: boolean;
	login: (emailAddress: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(getToken);
	const [user, setUser] = useState<AuthUser | null>(getUser);

	const login = useCallback(async (emailAddress: string, password: string) => {
		const res = await fetch(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ emailAddress, password }),
		});
		const data = await res.json();
		if (!res.ok || !data.token) throw new Error(data.error || "Invalid credentials");
		if (!data.user?.roles?.includes("admin")) throw new Error("Access restricted to admins");
		setAuth(data.token, data.user);
		setToken(data.token);
		setUser(data.user);
	}, []);

	const logout = useCallback(() => {
		clearAuth();
		setToken(null);
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
