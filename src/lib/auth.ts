const TOKEN_KEY = "erlume_token";
const USER_KEY = "erlume_user";

export interface AuthUser {
	_id: string;
	emailAddress: string;
	roles: string[];
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getUser = (): AuthUser | null => {
	try {
		const raw = localStorage.getItem(USER_KEY);
		return raw ? (JSON.parse(raw) as AuthUser) : null;
	} catch {
		return null;
	}
};

export const setAuth = (token: string, user: AuthUser): void => {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};
