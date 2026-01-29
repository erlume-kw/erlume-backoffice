// Core model types for the marketplace

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Seller {
  _id: string;
  userId: string;
  user?: User;
  businessName: string;
  description?: string;
  logo?: string;
  status: 'pending' | 'approved' | 'suspended';
  rating: number;
  totalSales: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: Category;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  _id: string;
  sellerId: string;
  seller?: Seller;
  categoryId: string;
  category?: Category;
  subCategoryId?: string;
  subCategory?: SubCategory;
  dropId?: string;
  drop?: Drop;
  title: string;
  description: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  originalPrice: number;
  price: number;
  images: string[];
  status: 'draft' | 'pending' | 'active' | 'sold' | 'archived';
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Drop {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'ended';
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Demand {
  _id: string;
  userId: string;
  user?: User;
  title: string;
  description: string;
  categoryId?: string;
  category?: Category;
  maxPrice?: number;
  status: 'open' | 'fulfilled' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  userId: string;
  user?: User;
  itemId?: string;
  item?: Item;
  sellerId?: string;
  seller?: Seller;
  orderId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  user?: User;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  discountCodeId?: string;
  discountCode?: DiscountCode;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  orderId: string;
  order?: Order;
  itemId: string;
  item?: Item;
  quantity: number;
  price: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  orderId: string;
  order?: Order;
  userId: string;
  user?: User;
  type: 'payment' | 'refund' | 'payout';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  provider: 'stripe' | 'paypal' | 'bank_transfer';
  providerTransactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  _id: string;
  userId: string;
  user?: User;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  _id: string;
  userId: string;
  user?: User;
  name: string;
  description?: string;
  image?: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitItem {
  _id: string;
  outfitId: string;
  outfit?: Outfit;
  itemId: string;
  item?: Item;
  position?: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Dashboard KPI types
export interface DashboardKpis {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalUsers: number;
  usersChange: number;
  totalItems: number;
  itemsChange: number;
  averageOrderValue: number;
  conversionRate: number;
  topCategories: { name: string; count: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TableFilters {
  search?: string;
  status?: string;
  categoryId?: string;
  sellerId?: string;
  dropId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
