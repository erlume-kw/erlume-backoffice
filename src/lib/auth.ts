const TOKEN_KEY = "erlume_token";
const REFRESH_TOKEN_KEY = "erlume_refresh_token";
const USER_KEY = "erlume_user";

export interface AuthUser {
	_id: string;
	emailAddress: string;
	roles: string[];
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getUser = (): AuthUser | null => {
	try {
		const raw = localStorage.getItem(USER_KEY);
		return raw ? (JSON.parse(raw) as AuthUser) : null;
	} catch {
		return null;
	}
};

export const setAuth = (accessToken: string, user: AuthUser, refreshToken?: string): void => {
	localStorage.setItem(TOKEN_KEY, accessToken);
	localStorage.setItem(USER_KEY, JSON.stringify(user));
	if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuth = (): void => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};
