import { endpoints } from "./api-config";
import type {
	CreditCard,
	Employee,
	Expense,
	Income,
	Order,
	Sale,
	Transaction,
} from "@/types/models";

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
	items: {
		...createCrudApi(endpoints.items),
		/** PATCH item (partial update). Use to set only seller_id when syncing from Sellers page. */
		patch: (id: string, data: Record<string, unknown>) =>
			apiRequest(`${endpoints.items}/${id}`, {
				method: "PATCH",
				body: JSON.stringify(data),
			}),
	},
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
	incomes: createCrudApi<Income>(endpoints.incomes),
	incomesExtra: {
		create: (data: Record<string, unknown>) =>
			apiRequest<Income>(endpoints.incomes, {
				method: "POST",
				body: JSON.stringify(data),
			}),
		update: (id: string, data: Record<string, unknown>) =>
			apiRequest<Income>(`${endpoints.incomes}/${id}`, {
				method: "PUT",
				body: JSON.stringify(data),
			}),
		patch: (id: string, data: Record<string, unknown>) =>
			apiRequest<Income>(`${endpoints.incomes}/${id}`, {
				method: "PATCH",
				body: JSON.stringify(data),
			}),
	},
	expenses: createCrudApi<Expense>(endpoints.expenses),
	sales: createCrudApi<Sale>(endpoints.sales),
	employees: createCrudApi<Employee>(endpoints.employees),
	salesExtra: {
		getByOrderId: (orderId: string) =>
			apiRequest<Sale[]>(`${endpoints.sales}/order/${orderId}`),
	},
	/**
	 * Enums API — OpenAPI paths: GET /api/enums, GET /api/enums/{category}.
	 * Categories: orderStatus, itemStatus, authenticationStatus, returnStatus,
	 * deliveryStatus, escalationStatus, bagBrand, kuwaitGovernorate, kuwaitCity, etc.
	 */
	enums: {
		/** GET /api/enums — get all enums. */
		getAll: () =>
			apiRequest<Record<string, { values?: Array<string | number> }>>(
				endpoints.enums,
			),
		/** GET /api/enums/{category} — get enum values by category. Returns string[]. */
		getByCategory: async (category: string): Promise<string[]> => {
			try {
				const url = `${endpoints.enums}/${category}`;
				const result = await apiRequest<unknown>(url);
				if (Array.isArray(result)) {
					return result.map((value) => String(value));
				}
				if (result && typeof result === "object") {
					const obj = result as Record<string, unknown>;
					if (Array.isArray(obj.values)) {
						return obj.values.map((value) => String(value));
					}
					// Response may wrap array in { data: [...] } or { data: { values: [...] } }
					for (const key of ["data", "items", "results"]) {
						const val = obj[key];
						if (Array.isArray(val)) {
							return val.map((value) => String(value));
						}
						if (val && typeof val === "object") {
							const inner = val as Record<string, unknown>;
							if (Array.isArray(inner.values)) {
								return inner.values.map((value) => String(value));
							}
							// Nested by category: { data: { bagBrand: ["Gucci", ...] } }
							const byCategory = inner[category];
							if (Array.isArray(byCategory)) {
								return byCategory.map((value) => String(value));
							}
						}
					}
					// Only use object keys as enum values if they look like enum entries (not wrapper keys)
					const skipKeys = new Set([
						"success",
						"category",
						"message",
						"error",
						"data",
						"items",
						"results",
						"values",
					]);
					const keys = Object.keys(obj).filter((k) => !skipKeys.has(k));
					if (keys.length > 0) {
						return keys.map((k) => String(k));
					}
				}
				return [];
			} catch (error) {
				console.error(`Failed to fetch enum category "${category}":`, error);
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
