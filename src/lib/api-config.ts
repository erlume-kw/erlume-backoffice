// API Configuration
//
// The backend is resolved at RUNTIME (not baked into the build) so one deployed
// backoffice can switch environments from the in-app toggle. Resolution order:
//   1. a saved choice in localStorage (set by the Dev/Production switcher), else
//   2. the build-time VITE_API_BASE_URL, else
//   3. the dev backend.
export const ENVIRONMENTS = {
	dev: "https://api-dev.erlume.com.kw/api",
	production: "https://api.erlume.com.kw/api",
} as const;
export type EnvName = keyof typeof ENVIRONMENTS;

const ENV_STORAGE_KEY = "API_BASE_URL";

// On the deployed backoffice only the two real backends are accepted — a stale
// saved value or a build env pointing at localhost would otherwise make every
// request (login included) fail against the CSP. Local dev (vite on localhost)
// may still use anything, e.g. http://localhost:3000/api.
const isLocalDev = typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
const KNOWN_BASES: string[] = Object.values(ENVIRONMENTS);
const usable = (url: string | null | undefined): url is string =>
	!!url && (isLocalDev || KNOWN_BASES.includes(url.replace(/\/+$/, "")));

function resolveApiBase(): string {
	try {
		const saved = localStorage.getItem(ENV_STORAGE_KEY);
		if (usable(saved)) return saved;
		if (saved) localStorage.removeItem(ENV_STORAGE_KEY); // drop a stale/localhost choice
	} catch { /* storage blocked */ }
	const built = import.meta.env.VITE_API_BASE_URL as string | undefined;
	return usable(built) ? built : ENVIRONMENTS.dev;
}

const RAW_API_BASE_URL = resolveApiBase();
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

/** Which named environment is active (for the switcher UI), or "custom". */
export const ACTIVE_ENV: EnvName | "custom" =
	(Object.entries(ENVIRONMENTS).find(
		([, url]) => url.replace(/\/+$/, "") === API_BASE_URL,
	)?.[0] as EnvName | undefined) ?? "custom";

/** Switch environment and reload so every endpoint picks up the new base. Lands
 *  on the root (not the current deep route) so the reload can't 404 before the
 *  SPA has booted. */
export function setEnvironment(env: EnvName): void {
	try { localStorage.setItem(ENV_STORAGE_KEY, ENVIRONMENTS[env]); } catch { /* storage blocked */ }
	window.location.assign("/");
}

/** OpenAPI spec URL for backoffice (Swagger UI, codegen). Prefer loading from backend. */
function getOpenApiSpecUrl(): string {
	const explicit = import.meta.env.VITE_OPENAPI_SPEC_URL;
	if (explicit && typeof explicit === "string") return explicit;
	const base =
		typeof API_BASE_URL === "string" && /^https?:\/\//.test(API_BASE_URL)
			? API_BASE_URL.replace(/\/api\/?$/, "")
			: "";
	return base
		? `${base}/api-docs/backoffice.json`
		: "/api-docs/backoffice.json";
}
export const OPENAPI_SPEC_URL = getOpenApiSpecUrl();

// REST API endpoints (aligned with api-routes.json)
export const endpoints = {
	users: `${API_BASE_URL}/users`,
	sellers: `${API_BASE_URL}/sellers`,
	items: `${API_BASE_URL}/items`,
	categories: `${API_BASE_URL}/categories`,
	subcategories: `${API_BASE_URL}/sub-categories`,
	orders: `${API_BASE_URL}/orders`,
	// Backend route uses /api/orderitems (no dash)
	orderitems: `${API_BASE_URL}/orderitems`,
	transactions: `${API_BASE_URL}/transactions`,
	// Backend route uses /api/creditcards (no dash)
	creditcards: `${API_BASE_URL}/creditcards`,
	reviews: `${API_BASE_URL}/reviews`,
	drops: `${API_BASE_URL}/drops`,
	/** Homepage banners — GET public (admins also get hidden ones), writes admin-only */
	banners: `${API_BASE_URL}/banners`,
	demands: `${API_BASE_URL}/demands`,
	discountcodes: `${API_BASE_URL}/discount-codes`,
	outfits: `${API_BASE_URL}/outfits`,
	// Backend route uses /api/outfititems (no dash)
	outfititems: `${API_BASE_URL}/outfititems`,
	incomes: `${API_BASE_URL}/incomes`,
	expenses: `${API_BASE_URL}/expenses`,
	sales: `${API_BASE_URL}/sales`,
	employees: `${API_BASE_URL}/employees`,
	/** GET /api/enums, GET /api/enums/{category} — OpenAPI Enums (orderStatus, itemStatus, bagBrand, kuwaitGovernorate, kuwaitCity, etc.) */
	enums: `${API_BASE_URL}/enums`,
	shipping: `${API_BASE_URL}/shipping`,
	newsletter: `${API_BASE_URL}/newsletter`,
	auditLogs: `${API_BASE_URL}/audit-logs`,
	/** GET /api/pricing-tool/quotes — consignment quote records (admin only) */
	quotes: `${API_BASE_URL}/pricing-tool/quotes`,
} as const;
