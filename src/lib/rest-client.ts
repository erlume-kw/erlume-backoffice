import { endpoints } from './api-config';

// Generic REST API helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// CRUD operations factory
function createCrudApi<T extends { _id: string }>(endpoint: string) {
  return {
    getAll: () => apiRequest<T[]>(endpoint),
    getById: (id: string) => apiRequest<T>(`${endpoint}/${id}`),
    create: (data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<T>) =>
      apiRequest<T>(`${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest<void>(`${endpoint}/${id}`, {
        method: 'DELETE',
      }),
  };
}

// REST API exports
export const restApi = {
  users: createCrudApi(endpoints.users),
  sellers: createCrudApi(endpoints.sellers),
  items: createCrudApi(endpoints.items),
  categories: createCrudApi(endpoints.categories),
  subcategories: createCrudApi(endpoints.subcategories),
  orders: createCrudApi(endpoints.orders),
  orderitems: createCrudApi(endpoints.orderitems),
  transactions: createCrudApi(endpoints.transactions),
  creditcards: createCrudApi(endpoints.creditcards),
  reviews: createCrudApi(endpoints.reviews),
  drops: createCrudApi(endpoints.drops),
  demands: createCrudApi(endpoints.demands),
  discountcodes: createCrudApi(endpoints.discountcodes),
  outfits: createCrudApi(endpoints.outfits),
  outfititems: createCrudApi(endpoints.outfititems),
  enums: {
    getAll: () => apiRequest<Record<string, string[]>>(endpoints.enums),
  },
};

export default restApi;
