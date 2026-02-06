import { endpoints } from "./api-config";
import type { CreditCard, Order, Sale, Transaction } from "@/types/models";

// Orders: spec only has PATCH for /api/orders/{id}, no PUT. Use ordersExtra.patch for updates.

/** Build query string from params (aligns with OpenAPI list query params). */
function buildQuery(
	params?: Record<string, string | number | boolean | undefined>,
): string {
	if (!params || Object.keys(params).length === 0) return "";
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") {
			search.set(key, String(value));
		}
	}
	const q = search.toString();
	return q ? `?${q}` : "";
}

// Generic REST API helper
async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(endpoint, {
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: "An error occurred" }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	const text = await response.text();
	if (!text.trim()) return undefined as T;
	try {
		return JSON.parse(text) as T;
	} catch {
		return undefined as T;
	}
}

// CRUD operations factory (getAll supports OpenAPI list query params)
function createCrudApi<T extends { _id: string }>(endpoint: string) {
	return {
		getAll: (params?: Record<string, string | number | boolean | undefined>) =>
			apiRequest<T[]>(`${endpoint}${buildQuery(params ?? {})}`),
		getById: (id: string) => apiRequest<T>(`${endpoint}/${id}`),
		create: (data: Omit<T, "_id" | "createdAt" | "updatedAt">) =>
			apiRequest<T>(endpoint, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		update: (id: string, data: Partial<T>) =>
			apiRequest<T>(`${endpoint}/${id}`, {
				method: "PUT",
				body: JSON.stringify(data),
			}),
		delete: (id: string) =>
			apiRequest<void>(`${endpoint}/${id}`, {
				method: "DELETE",
			}),
	};
}

// REST API exports
export const restApi = {
	users: createCrudApi(endpoints.users),
	sellers: {
		getAll: (params?: Record<string, string | number | boolean | undefined>) =>
			apiRequest(`${endpoints.sellers}${buildQuery(params ?? {})}`),
		getById: (id: string) => apiRequest(`${endpoints.sellers}/${id}`),
		create: (data: Record<string, unknown>) =>
			apiRequest(endpoints.sellers, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		update: (id: string, data: Record<string, unknown>) =>
			apiRequest(`${endpoints.sellers}/${id}`, {
				method: "PUT",
				body: JSON.stringify(data),
			}),
		patch: (id: string, data: Record<string, unknown>) =>
			apiRequest(`${endpoints.sellers}/${id}`, {
				method: "PATCH",
				body: JSON.stringify(data),
			}),
		delete: (id: string) =>
			apiRequest(`${endpoints.sellers}/${id}`, {
				method: "DELETE",
			}),
	},
	items: createCrudApi(endpoints.items),
	categories: createCrudApi(endpoints.categories),
	subcategories: createCrudApi(endpoints.subcategories),
	orders: {
		getAll: (params?: Record<string, string | number | boolean | undefined>) =>
			apiRequest<Order[]>(`${endpoints.orders}${buildQuery(params ?? {})}`),
		getById: (id: string) => apiRequest<Order>(`${endpoints.orders}/${id}`),
		create: (data: Record<string, unknown>) =>
			apiRequest<Order>(endpoints.orders, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		delete: (id: string) =>
			apiRequest<void>(`${endpoints.orders}/${id}`, { method: "DELETE" }),
	},
	orderitems: createCrudApi(endpoints.orderitems),
	transactions: createCrudApi<Transaction>(endpoints.transactions),
	creditcards: createCrudApi(endpoints.creditcards),
	reviews: createCrudApi(endpoints.reviews),
	drops: createCrudApi(endpoints.drops),
	demands: createCrudApi(endpoints.demands),
	discountcodes: createCrudApi(endpoints.discountcodes),
	outfits: createCrudApi(endpoints.outfits),
	outfititems: createCrudApi(endpoints.outfititems),
	incomes: createCrudApi(endpoints.incomes),
	expenses: createCrudApi(endpoints.expenses),
	sales: createCrudApi<Sale>(endpoints.sales),
	salesExtra: {
		getByOrderId: (orderId: string) =>
			apiRequest<Sale[]>(`${endpoints.sales}/order/${orderId}`),
	},
	enums: {
		getAll: () =>
			apiRequest<Record<string, { values: Array<string | number> }>>(
				endpoints.enums,
			),
		getByCategory: async (category: string) => {
			try {
				const url = `${endpoints.enums}/${category}`;
				console.log(`Fetching enum category from: ${url}`);
				const result = await apiRequest<
					Array<string | number> | { values?: Array<string | number> }
				>(url);
				console.log(`Enum category "${category}" response:`, result);
				if (Array.isArray(result)) {
					const mapped = result.map((value) => String(value));
					console.log(`Enum category "${category}" mapped to array:`, mapped);
					return mapped;
				}
				if (result && typeof result === "object") {
					const values = result.values;
					if (Array.isArray(values)) {
						const mapped = values.map((value) => String(value));
						console.log(`Enum category "${category}" mapped from object:`, mapped);
						return mapped;
					}
				}
				console.warn(`Enum category "${category}" returned unexpected format:`, result);
				return [];
			} catch (error) {
				console.error(`Failed to fetch enum category "${category}":`, error);
				// Return empty array instead of throwing to prevent breaking the UI
				return [];
			}
		},
	},
	usersExtra: {
		/** Soft-delete user (set isDeleted: true). Use this for the Delete button. Seller updates: use PATCH /api/sellers/{id} only (id = seller _id or user ID). */
		softDelete: (id: string) =>
			apiRequest<unknown>(`${endpoints.users}/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ isDeleted: true }),
			}),
	},
	ordersExtra: {
		/** PATCH /api/orders/{id}/status — body uses order_status to align with OpenAPI. */
		updateStatus: (id: string, order_status: string) =>
			apiRequest(`${endpoints.orders}/${id}/status`, {
				method: "PATCH",
				body: JSON.stringify({ order_status }),
			}),
		/** PATCH /api/orders/{id} — partial update: order_status, deliveryDate, deliveryStatus, trackingReference. */
		patch: (
			id: string,
			data: {
				order_status?: string;
				deliveryDate?: string;
				deliveryStatus?: string;
				trackingReference?: string;
			},
		) =>
			apiRequest<Order>(`${endpoints.orders}/${id}`, {
				method: "PATCH",
				body: JSON.stringify(data),
			}),
		/** GET /api/orders/user/{userId} — list orders by user (OpenAPI). */
		getByUserId: (userId: string, params?: { year?: number; month?: number }) =>
			apiRequest<Order[]>(
				`${endpoints.orders}/user/${userId}${buildQuery(params ?? {})}`,
			),
	},
	transactionsExtra: {
		/** GET /api/transactions/order/{orderId} — list transactions by order (OpenAPI). */
		getByOrderId: (
			orderId: string,
			params?: { year?: number; month?: number },
		) =>
			apiRequest<Transaction[]>(
				`${endpoints.transactions}/order/${orderId}${buildQuery(params ?? {})}`,
			),
	},
	creditcardsExtra: {
		/** GET /api/creditcards/user/{userId} — list credit cards by user (OpenAPI). */
		getByUserId: (userId: string) =>
			apiRequest<CreditCard[]>(`${endpoints.creditcards}/user/${userId}`),
	},
	dropsExtra: {
		getItems: (id: string) => apiRequest(`${endpoints.drops}/${id}/items`),
		addItems: (id: string, itemIds: string[]) =>
			apiRequest(`${endpoints.drops}/${id}/items`, {
				method: "POST",
				body: JSON.stringify({ itemIds }),
			}),
		removeItem: (id: string, itemId: string) =>
			apiRequest(`${endpoints.drops}/${id}/items/${itemId}`, {
				method: "DELETE",
			}),
	},
};

export default restApi;
