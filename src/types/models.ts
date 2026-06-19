// Core model types for the marketplace

export interface Address {
	street: string;
	city: string;
	block: string;
	governorate: string;
	house: string;
	flat?: string;
}

export interface User {
	_id: string;
	password: string;
	emailAddress: string;
	phoneNumber: string;
	address: Address;
	roles: string[];
	cardIds?: string[];
	isDeleted?: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Seller {
	_id: string;
	userId: string;
	fullName?: string;
	emailAddress?: string;
	phoneNumber?: string;
	addressText?: string;
	balance: string;
	itemIds?: string[];
	IBAN?: string;
	qrCode?: string;
	isDeactivated?: boolean;
	consentGiven?: boolean;
	preferredPickupDate?: string;
	intakeTimestamp?: string;
	sellerPolicyAcceptedAt?: string;
	escalationStatus?: string;
	escalationNotes?: string;
	onboardingStatus?: string;
	itemsOnboardingStatus?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Category {
	_id: string;
	name: string;
	base_rate: string;
	op_rate?: string;
	clean_rate?: string;
	sub_category_id?: string;
	createdAt: string;
	updatedAt: string;
}

export interface SubCategory {
	_id: string;
	sub_cat_name: string;
	category_id: string;
	demand_id?: string;
	sub_clean_rate?: string;
	createdAt: string;
	updatedAt: string;
}

/** Item — canonical schema: itemName, brandName (only brand field; do not use brand), basePrice, condition, uploadedAt, saleRate, itemStatus, color, size, itemModel, year, quantity, listingPrice (required), category_id, etc. */
export interface Item {
	_id: string;
	basePrice: string;
	listingPrice: string;
	condition: string;
	uploadedAt: string;
	saleRate: string;
	itemStatus: string;
	color: string;
	size: string;
	itemName: string;
	itemModel?: string;
	year?: string;
	quantity: string;
	brandName: string;
	imageUrls: string[];
	mainImageUrl?: string;
	receiptPhotoUrls?: string[];
	priceEstimatorUrls?: string[];
	quoteUrls?: string[];
	approved?: boolean;
	approvedNextDrop?: boolean;
	orderId?: string;
	authNeeded?: boolean;
	cleaningNeeded?: boolean;
	photographed?: boolean;
	authenticationStatus?: string;
	authenticatedAt?: string;
	returnDate?: string;
	returnStatus?: string;
	seller_id?: string;
	category_id: string;
	sub_category_id?: string;
	drop_id?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Drop {
	_id: string;
	name: string;
	description?: string;
	releaseDate: string;
	status: string;
	bannerImageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Demand {
	_id: string;
	demand_name: string;
	demand_rate?: string;
	createdAt: string;
	updatedAt: string;
}

export interface DiscountCode {
	_id: string;
	code: string;
	discount_percentage: string;
	expiry_date: string;
	is_active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Review {
	_id: string;
	userId?: string;
	sellerId: string;
	rating: number;
	description: string;
	createdAt: string;
	updatedAt: string;
}

export interface Order {
	_id: string;
	user_id?: string;
	guestInfo?: {
		name: string;
		phoneNumber: string;
		emailAddress?: string;
		shippingAddress: {
			street: string;
			city: string;
			block: string;
			governorate: string;
			house: string;
			flat?: string;
		};
	};
	orderitem_ids: string[];
	order_status: string;
	deliveryDate?: string;
	deliveryStatus?: string;
	trackingReference?: string;
	createdAt: string;
	updatedAt: string;
}

export interface OrderItem {
	_id: string;
	order_id: string;
	item_id: string;
	quantity: number;
	price: string;
	is_returned: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Income {
	_id: string;
	order_id?: string;
	order_item_id?: string;
	item_id?: string;
	seller_id?: string;
	amount: string;
	erlumeCommissionAmount?: string;
	sellerPayoutAmount?: string;
	currency?: string;
	platform?: string;
	income_type?: string;
	received_at?: string;
	month?: string;
	prelaunch_bag?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Transaction {
	_id: string;
	order_id: string;
	discount_rate: string;
	amount: string;
	discount_id?: string;
	status: string;
	paymentMethod?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Sale {
	_id: string;
	order_id?: string;
	order_item_id?: string;
	item_id?: string;
	transaction_id?: string;
	amount?: string;
	listingPrice?: string;
	erlumeCommission?: string;
	sellerPayout?: string;
	buyer?: string;
	status?: string;
	sale_date?: string;
	bag_record?: string;
	invoice_number?: string;
	invoice_url?: string;
	payment_evidence_url?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Expense {
	_id: string;
	name: string;
	cost: string;
	currency?: string;
	employee_id?: string;
	notes?: string;
	type: string[];
	month: string;
	paidBy?: string;
	isRecurring?: boolean;
	phase?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Employee {
	_id: string;
	name: string;
	photo?: string;
	role?: string;
	type?: string;
	salaryActual?: string;
	salaryProjected?: string;
	user_id?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreditCard {
	_id: string;
	cardNumber: string;
	expiryDate: string;
	holderName: string;
	createdAt: string;
	updatedAt: string;
}

export interface Outfit {
	_id: string;
	item_ids: string[];
	outfit_title: string;
	outfit_tags: string;
	coverImageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface OutfitItem {
	_id: string;
	item_id: string;
	outfit_id: string;
	featured_in_product: boolean;
	createdAt: string;
	updatedAt: string;
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
	sortOrder?: "asc" | "desc";
}

export interface ShippingMethod {
	_id: string;
	name: string;
	description?: string;
	price: number;
	zones: string[]; // Kuwait governorate names; empty = all zones
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface NewsletterSubscriber {
	_id: string;
	email: string;
	subscribedAt: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}
