// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const GRAPHQL_ENDPOINT =
	import.meta.env.VITE_GRAPHQL_ENDPOINT || "/graphql";

/** OpenAPI spec URL for backoffice (Swagger UI, codegen). Prefer loading from backend. */
function getOpenApiSpecUrl(): string {
	const explicit = import.meta.env.VITE_OPENAPI_SPEC_URL;
	if (explicit && typeof explicit === "string") return explicit;
	const base = typeof API_BASE_URL === "string" && /^https?:\/\//.test(API_BASE_URL)
		? API_BASE_URL.replace(/\/api\/?$/, "")
		: "";
	return base ? `${base}/api-docs/backoffice.json` : "/api-docs/backoffice.json";
}
export const OPENAPI_SPEC_URL = getOpenApiSpecUrl();

// REST API endpoints
export const endpoints = {
	users: `${API_BASE_URL}/users`,
	sellers: `${API_BASE_URL}/sellers`,
	items: `${API_BASE_URL}/items`,
	categories: `${API_BASE_URL}/categories`,
	subcategories: `${API_BASE_URL}/subcategories`,
	orders: `${API_BASE_URL}/orders`,
	orderitems: `${API_BASE_URL}/orderitems`,
	transactions: `${API_BASE_URL}/transactions`,
	creditcards: `${API_BASE_URL}/creditcards`,
	reviews: `${API_BASE_URL}/reviews`,
	drops: `${API_BASE_URL}/drops`,
	demands: `${API_BASE_URL}/demands`,
	discountcodes: `${API_BASE_URL}/discountcodes`,
	outfits: `${API_BASE_URL}/outfits`,
	outfititems: `${API_BASE_URL}/outfititems`,
	incomes: `${API_BASE_URL}/incomes`,
	expenses: `${API_BASE_URL}/expenses`,
	sales: `${API_BASE_URL}/sales`,
	enums: `${API_BASE_URL}/enums`,
} as const;
