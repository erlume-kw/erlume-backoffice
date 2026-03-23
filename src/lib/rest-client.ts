import { endpoints } from "./api-config";
import type {
	CreditCard,
	DiscountCode,
	Employee,
	Expense,
	Income,
	Order,
	OrderItem,
	OutfitItem,
	Sale,
	SubCategory,
	Transaction,
} from "@/types/models";
import { ApiError, type ApiErrorResponse } from "./api-errors";

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
		// Try to parse error response with new validation format
		let errorData: ApiErrorResponse | { message?: string } | null = null;

		try {
			// Get response text first (more reliable than .json())
			const text = await response.text();
			
			if (text && text.trim()) {
				try {
					const json = JSON.parse(text);
					// Check if it's the new error format
					if (
						json &&
						typeof json === "object" &&
						"success" in json &&
						json.success === false
					) {
						errorData = json as ApiErrorResponse;
					} else if (json && typeof json === "object" && "message" in json) {
						errorData = json;
					} else if (json && typeof json === "object" && "error" in json) {
						// Some APIs return { error: "message" } format
						errorData = { message: String(json.error) };
					}
				} catch (jsonError) {
					// Not valid JSON, treat as plain text error (but limit length)
					const errorText = text.length > 500 ? text.substring(0, 500) + "..." : text;
					errorData = { message: errorText };
				}
			}
		} catch (parseError) {
			// If reading response fails entirely, use default error
			console.error(`Failed to parse error response for ${endpoint}:`, parseError);
			errorData = null;
		}

		// Create ApiError with validation details if available
		if (
			errorData &&
			typeof errorData === "object" &&
			"success" in errorData &&
			errorData.success === false
		) {
			const apiError = errorData as ApiErrorResponse;
			throw new ApiError(
				apiError.error || "An error occurred",
				apiError.code,
				apiError.details,
				response.status,
			);
		}

		// Fallback to generic error for backward compatibility
		const message =
			errorData && typeof errorData === "object" && "message" in errorData
				? errorData.message || `HTTP ${response.status} ${response.statusText}`
				: `HTTP ${response.status} ${response.statusText || "Error"}`;
		throw new ApiError(message, undefined, undefined, response.status);
	}

	const text = await response.text();
	if (!text.trim()) return undefined as T;
	try {
		const parsed = JSON.parse(text);
		// Handle wrapped response format: { success: true, data: T }
		if (
			parsed &&
			typeof parsed === "object" &&
			"success" in parsed &&
			parsed.success === true &&
			"data" in parsed
		) {
			const data = parsed.data;
			// Ensure we return the correct type (handle nested data if needed)
			return data as T;
		}
		// Return direct response (backward compatibility)
		return parsed as T;
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
	subcategories: {
		...createCrudApi<SubCategory>(endpoints.subcategories),
		/** GET /api/sub-categories/category/:categoryId — get subcategories by category ID */
		getByCategoryId: (categoryId: string) =>
			apiRequest<SubCategory[]>(`${endpoints.subcategories}/category/${categoryId}`),
	},
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
	orderitems: {
		...createCrudApi<OrderItem>(endpoints.orderitems),
		/** GET /api/order-items/order/:orderId — get order items by order ID */
		getByOrderId: (orderId: string) =>
			apiRequest<OrderItem[]>(`${endpoints.orderitems}/order/${orderId}`),
		/** PATCH /api/order-items/:id/return — mark order item as returned */
		markReturned: (id: string) =>
			apiRequest<OrderItem>(`${endpoints.orderitems}/${id}/return`, {
				method: "PATCH",
			}),
	},
	transactions: createCrudApi<Transaction>(endpoints.transactions),
	creditcards: createCrudApi<CreditCard>(endpoints.creditcards),
	reviews: {
		...createCrudApi(endpoints.reviews),
		/** GET /api/reviews/product/:productId — get reviews by product ID */
		getByProductId: (productId: string) =>
			apiRequest(`${endpoints.reviews}/product/${productId}`),
		/** GET /api/reviews/seller/:sellerId — get reviews by seller ID */
		getBySellerId: (sellerId: string) =>
			apiRequest(`${endpoints.reviews}/seller/${sellerId}`),
	},
	drops: createCrudApi(endpoints.drops),
	demands: {
		...createCrudApi(endpoints.demands),
		/** GET /api/demands/subcategory/:subCategoryId — get demands by subcategory ID */
		getBySubCategoryId: (subCategoryId: string) =>
			apiRequest(`${endpoints.demands}/subcategory/${subCategoryId}`),
	},
	discountcodes: {
		...createCrudApi<DiscountCode>(endpoints.discountcodes),
		/** GET /api/discount-codes/code/:code — get discount code by code string */
		getByCode: (code: string) =>
			apiRequest<DiscountCode>(`${endpoints.discountcodes}/code/${code}`),
		/** POST /api/discount-codes/validate — validate discount code */
		validate: (code: string, orderTotal?: string) =>
			apiRequest<{ valid: boolean; discount?: string; error?: string }>(
				`${endpoints.discountcodes}/validate`,
				{
					method: "POST",
					body: JSON.stringify({ code, orderTotal }),
				},
			),
	},
	outfits: createCrudApi(endpoints.outfits),
	outfititems: {
		...createCrudApi<OutfitItem>(endpoints.outfititems),
		/** GET /api/outfit-items/outfit/:outfitId — get outfit items by outfit ID */
		getByOutfitId: (outfitId: string) =>
			apiRequest<OutfitItem[]>(`${endpoints.outfititems}/outfit/${outfitId}`),
		/** PATCH /api/outfit-items/:id/featured — toggle featured status */
		toggleFeatured: (id: string) =>
			apiRequest<OutfitItem>(`${endpoints.outfititems}/${id}/featured`, {
				method: "PATCH",
			}),
	},
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
		/** GET /api/sales/order/:orderId — get sales by order ID */
		getByOrderId: (orderId: string, params?: { year?: number; month?: number }) =>
			apiRequest<Sale[]>(
				`${endpoints.sales}/order/${orderId}${buildQuery(params ?? {})}`,
			),
		/** POST /api/sales/recalculate-commissions — recalculate sale commissions */
		recalculateCommissions: () =>
			apiRequest(`${endpoints.sales}/recalculate-commissions`, {
				method: "POST",
			}),
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
		/** GET /api/credit-cards/user/:userId — list credit cards by user */
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

// Export ApiError for use in pages/components
export { ApiError } from "./api-errors";
export type { ValidationErrorDetail, ApiErrorResponse } from "./api-errors";
