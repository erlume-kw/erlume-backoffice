export type EnumOptionValue = string | number;

export type EnumOption = {
	label: string;
	value: EnumOptionValue;
};

export type EnumCategory = {
	values: EnumOptionValue[];
	options: EnumOption[];
};

export type EnumCatalog = {
	orderStatus: EnumCategory;
	itemStatus: EnumCategory;
	userRole: EnumCategory;
	dropStatus: EnumCategory;
	itemCondition: EnumCategory;
	reviewStars: EnumCategory;
	kuwaitGovernorate: EnumCategory;
	kuwaitCity: EnumCategory;
	transactionStatus: EnumCategory;
	paymentMethod: EnumCategory;
};

export const enumCatalog: EnumCatalog = {
	orderStatus: {
		values: [
			"pending",
			"processing",
			"shipped",
			"delivered",
			"cancelled",
			"returned",
		],
		options: [
			{ label: "Pending", value: "pending" },
			{ label: "Processing", value: "processing" },
			{ label: "Shipped", value: "shipped" },
			{ label: "Delivered", value: "delivered" },
			{ label: "Cancelled", value: "cancelled" },
			{ label: "Returned", value: "returned" },
		],
	},
	itemStatus: {
		values: ["available", "sold", "out_of_stock", "pending", "approved", "rejected"],
		options: [
			{ label: "Available", value: "available" },
			{ label: "Sold", value: "sold" },
			{ label: "OutOfStock", value: "out_of_stock" },
			{ label: "Pending", value: "pending" },
			{ label: "Approved", value: "approved" },
			{ label: "Rejected", value: "rejected" },
		],
	},
	userRole: {
		values: ["user", "seller", "admin"],
		options: [
			{ label: "USER", value: "user" },
			{ label: "SELLER", value: "seller" },
			{ label: "ADMIN", value: "admin" },
		],
	},
	dropStatus: {
		values: ["upcoming", "active", "ended"],
		options: [
			{ label: "Upcoming", value: "upcoming" },
			{ label: "Active", value: "active" },
			{ label: "Ended", value: "ended" },
		],
	},
	itemCondition: {
		values: ["new", "like_new", "gently_used", "fair_condition", "worn_condition"],
		options: [
			{ label: "New", value: "new" },
			{ label: "LikeNew", value: "like_new" },
			{ label: "GentlyUsed", value: "gently_used" },
			{ label: "Fair", value: "fair_condition" },
			{ label: "Worn", value: "worn_condition" },
		],
	},
	reviewStars: {
		values: [1, 2, 3, 4, 5],
		options: [
			{ label: "1 Star", value: 1 },
			{ label: "2 Stars", value: 2 },
			{ label: "3 Stars", value: 3 },
			{ label: "4 Stars", value: 4 },
			{ label: "5 Stars", value: 5 },
		],
	},
	kuwaitGovernorate: {
		values: [
			"Al Asimah",
			"Hawalli",
			"Farwaniya",
			"Ahmadi",
			"Jahra",
			"Mubarak Al-Kabeer",
		],
		options: [
			{ label: "Al Asimah", value: "Al Asimah" },
			{ label: "Hawalli", value: "Hawalli" },
			{ label: "Farwaniya", value: "Farwaniya" },
			{ label: "Ahmadi", value: "Ahmadi" },
			{ label: "Jahra", value: "Jahra" },
			{ label: "Mubarak Al-Kabeer", value: "Mubarak Al-Kabeer" },
		],
	},
	kuwaitCity: {
		values: [
			"Kuwait City",
			"Sharq",
			"Dasma",
			"Salmiya",
			"Bneid Al-Qar",
			"Kaifan",
			"Khaldiya",
			"Mansouriya",
			"Rawda",
			"Surra",
			"Yarmouk",
			"Hawalli",
			"Salwa",
			"Bayraq",
			"Jabriya",
			"Mishref",
			"Rumaithiya",
			"Zahra",
			"Farwaniya",
			"Abraq Kheetan",
			"Ardiya",
			"Jleeb Al-Shuyoukh",
			"Khaitan",
			"Omariya",
			"Rai",
			"Rehab",
			"Sabah Al-Nasser",
			"Ahmadi",
			"Fahaheel",
			"Mahboula",
			"Mangaf",
			"Wafra",
			"Zour",
			"Jahra",
			"Abdali",
			"Kabd",
			"Saad Al-Abdullah",
			"Sulaibiya",
			"Taima",
			"Mubarak Al-Kabeer",
			"Abu Al-Hasaniya",
			"Adan",
			"Fnaitees",
			"Messila",
			"Qurain",
			"Sabah Al-Ahmad",
		],
		options: [
			{ label: "Kuwait City", value: "Kuwait City" },
			{ label: "Sharq", value: "Sharq" },
			{ label: "Dasma", value: "Dasma" },
			{ label: "Salmiya", value: "Salmiya" },
			{ label: "Bneid Al-Qar", value: "Bneid Al-Qar" },
			{ label: "Kaifan", value: "Kaifan" },
			{ label: "Khaldiya", value: "Khaldiya" },
			{ label: "Mansouriya", value: "Mansouriya" },
			{ label: "Rawda", value: "Rawda" },
			{ label: "Surra", value: "Surra" },
			{ label: "Yarmouk", value: "Yarmouk" },
			{ label: "Hawalli", value: "Hawalli" },
			{ label: "Salwa", value: "Salwa" },
			{ label: "Bayraq", value: "Bayraq" },
			{ label: "Jabriya", value: "Jabriya" },
			{ label: "Mishref", value: "Mishref" },
			{ label: "Rumaithiya", value: "Rumaithiya" },
			{ label: "Zahra", value: "Zahra" },
			{ label: "Farwaniya", value: "Farwaniya" },
			{ label: "Abraq Kheetan", value: "Abraq Kheetan" },
			{ label: "Ardiya", value: "Ardiya" },
			{ label: "Jleeb Al-Shuyoukh", value: "Jleeb Al-Shuyoukh" },
			{ label: "Khaitan", value: "Khaitan" },
			{ label: "Omariya", value: "Omariya" },
			{ label: "Rai", value: "Rai" },
			{ label: "Rehab", value: "Rehab" },
			{ label: "Sabah Al-Nasser", value: "Sabah Al-Nasser" },
			{ label: "Ahmadi", value: "Ahmadi" },
			{ label: "Fahaheel", value: "Fahaheel" },
			{ label: "Mahboula", value: "Mahboula" },
			{ label: "Mangaf", value: "Mangaf" },
			{ label: "Wafra", value: "Wafra" },
			{ label: "Zour", value: "Zour" },
			{ label: "Jahra", value: "Jahra" },
			{ label: "Abdali", value: "Abdali" },
			{ label: "Kabd", value: "Kabd" },
			{ label: "Saad Al-Abdullah", value: "Saad Al-Abdullah" },
			{ label: "Sulaibiya", value: "Sulaibiya" },
			{ label: "Taima", value: "Taima" },
			{ label: "Mubarak Al-Kabeer", value: "Mubarak Al-Kabeer" },
			{ label: "Abu Al-Hasaniya", value: "Abu Al-Hasaniya" },
			{ label: "Adan", value: "Adan" },
			{ label: "Fnaitees", value: "Fnaitees" },
			{ label: "Messila", value: "Messila" },
			{ label: "Qurain", value: "Qurain" },
			{ label: "Sabah Al-Ahmad", value: "Sabah Al-Ahmad" },
		],
	},
	transactionStatus: {
		values: [
			"pending",
			"processing",
			"completed",
			"failed",
			"refunded",
			"partially_refunded",
			"cancelled",
		],
		options: [
			{ label: "Pending", value: "pending" },
			{ label: "Processing", value: "processing" },
			{ label: "Completed", value: "completed" },
			{ label: "Failed", value: "failed" },
			{ label: "Refunded", value: "refunded" },
			{ label: "PartiallyRefunded", value: "partially_refunded" },
			{ label: "Cancelled", value: "cancelled" },
		],
	},
	paymentMethod: {
		values: [
			"knet",
			"credit_card",
			"debit_card",
			"tap_payments",
			"cash_on_delivery",
			"bank_transfer",
			"apple_pay",
			"google_pay",
		],
		options: [
			{ label: "KNET", value: "knet" },
			{ label: "CreditCard", value: "credit_card" },
			{ label: "DebitCard", value: "debit_card" },
			{ label: "TapPayments", value: "tap_payments" },
			{ label: "CashOnDelivery", value: "cash_on_delivery" },
			{ label: "BankTransfer", value: "bank_transfer" },
			{ label: "ApplePay", value: "apple_pay" },
			{ label: "GooglePay", value: "google_pay" },
		],
	},
};

export const kuwaitGovernorateCities = {
	"Al Asimah": {
		governorate: "Al Asimah",
		cities: [
			{ label: "Kuwait City", value: "Kuwait City" },
			{ label: "Sharq", value: "Sharq" },
			{ label: "Dasma", value: "Dasma" },
			{ label: "Salmiya", value: "Salmiya" },
			{ label: "Bneid Al-Qar", value: "Bneid Al-Qar" },
			{ label: "Kaifan", value: "Kaifan" },
			{ label: "Khaldiya", value: "Khaldiya" },
			{ label: "Mansouriya", value: "Mansouriya" },
			{ label: "Rawda", value: "Rawda" },
			{ label: "Surra", value: "Surra" },
			{ label: "Yarmouk", value: "Yarmouk" },
		],
		cityValues: [
			"Kuwait City",
			"Sharq",
			"Dasma",
			"Salmiya",
			"Bneid Al-Qar",
			"Kaifan",
			"Khaldiya",
			"Mansouriya",
			"Rawda",
			"Surra",
			"Yarmouk",
		],
	},
	Hawalli: {
		governorate: "Hawalli",
		cities: [
			{ label: "Hawalli", value: "Hawalli" },
			{ label: "Salwa", value: "Salwa" },
			{ label: "Bayraq", value: "Bayraq" },
			{ label: "Jabriya", value: "Jabriya" },
			{ label: "Mishref", value: "Mishref" },
			{ label: "Rumaithiya", value: "Rumaithiya" },
			{ label: "Zahra", value: "Zahra" },
		],
		cityValues: [
			"Hawalli",
			"Salwa",
			"Bayraq",
			"Jabriya",
			"Mishref",
			"Rumaithiya",
			"Zahra",
		],
	},
	Farwaniya: {
		governorate: "Farwaniya",
		cities: [
			{ label: "Farwaniya", value: "Farwaniya" },
			{ label: "Abraq Kheetan", value: "Abraq Kheetan" },
			{ label: "Ardiya", value: "Ardiya" },
			{ label: "Jleeb Al-Shuyoukh", value: "Jleeb Al-Shuyoukh" },
			{ label: "Khaitan", value: "Khaitan" },
			{ label: "Omariya", value: "Omariya" },
			{ label: "Rai", value: "Rai" },
			{ label: "Rehab", value: "Rehab" },
			{ label: "Sabah Al-Nasser", value: "Sabah Al-Nasser" },
		],
		cityValues: [
			"Farwaniya",
			"Abraq Kheetan",
			"Ardiya",
			"Jleeb Al-Shuyoukh",
			"Khaitan",
			"Omariya",
			"Rai",
			"Rehab",
			"Sabah Al-Nasser",
		],
	},
	Ahmadi: {
		governorate: "Ahmadi",
		cities: [
			{ label: "Ahmadi", value: "Ahmadi" },
			{ label: "Fahaheel", value: "Fahaheel" },
			{ label: "Mahboula", value: "Mahboula" },
			{ label: "Mangaf", value: "Mangaf" },
			{ label: "Wafra", value: "Wafra" },
			{ label: "Zour", value: "Zour" },
		],
		cityValues: ["Ahmadi", "Fahaheel", "Mahboula", "Mangaf", "Wafra", "Zour"],
	},
	Jahra: {
		governorate: "Jahra",
		cities: [
			{ label: "Jahra", value: "Jahra" },
			{ label: "Abdali", value: "Abdali" },
			{ label: "Kabd", value: "Kabd" },
			{ label: "Saad Al-Abdullah", value: "Saad Al-Abdullah" },
			{ label: "Sulaibiya", value: "Sulaibiya" },
			{ label: "Taima", value: "Taima" },
		],
		cityValues: [
			"Jahra",
			"Abdali",
			"Kabd",
			"Saad Al-Abdullah",
			"Sulaibiya",
			"Taima",
		],
	},
	"Mubarak Al-Kabeer": {
		governorate: "Mubarak Al-Kabeer",
		cities: [
			{ label: "Mubarak Al-Kabeer", value: "Mubarak Al-Kabeer" },
			{ label: "Abu Al-Hasaniya", value: "Abu Al-Hasaniya" },
			{ label: "Adan", value: "Adan" },
			{ label: "Fnaitees", value: "Fnaitees" },
			{ label: "Messila", value: "Messila" },
			{ label: "Qurain", value: "Qurain" },
			{ label: "Sabah Al-Ahmad", value: "Sabah Al-Ahmad" },
		],
		cityValues: [
			"Mubarak Al-Kabeer",
			"Abu Al-Hasaniya",
			"Adan",
			"Fnaitees",
			"Messila",
			"Qurain",
			"Sabah Al-Ahmad",
		],
	},
} as const;

export type EnumCatalogKey = keyof EnumCatalog;

export type SelectOption = {
	value: string;
	label: string;
};

const formatFallbackLabel = (value: string) =>
	value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getEnumValues = (
	key: EnumCatalogKey,
	values?: EnumOptionValue[],
): string[] => {
	const resolvedValues =
		values && values.length > 0 ? values : enumCatalog[key].values;
	return resolvedValues.map((value) => String(value));
};

export const getEnumOptions = (
	key: EnumCatalogKey,
	values?: EnumOptionValue[],
): SelectOption[] => {
	const resolvedValues =
		values && values.length > 0 ? values : enumCatalog[key].values;
	const labelByValue = new Map(
		enumCatalog[key].options.map((option) => [
			String(option.value),
			option.label,
		]),
	);
	return resolvedValues.map((value) => ({
		value: String(value),
		label: labelByValue.get(String(value)) ?? formatFallbackLabel(String(value)),
	}));
};
