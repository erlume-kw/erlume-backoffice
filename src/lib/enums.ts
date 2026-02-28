export type EnumOptionValue = string | number;

export type EnumOption = {
	label: string;
	value: EnumOptionValue;
};

/** Category names for API enum endpoints (e.g. GET /api/enums/{category}). Values are always fetched from the API. */
export type EnumCatalogKey =
	| "orderStatus"
	| "itemStatus"
	| "userRole"
	| "dropStatus"
	| "itemCondition"
	| "reviewStars"
	| "kuwaitGovernorate"
	| "kuwaitCity"
	| "transactionStatus"
	| "paymentMethod"
	| "bagBrand"
	| "expenseType";

export type SelectOption = {
	value: string;
	label: string;
};

const formatFallbackLabel = (value: string) =>
	value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

/** Returns enum values from API response only. Pass the array from GET /api/enums/{category}. */
export const getEnumValues = (
	_key: EnumCatalogKey,
	values?: EnumOptionValue[],
): string[] => {
	const list = Array.isArray(values) ? values : [];
	return list.map((v) => String(v));
};

/** Builds select options from API enum values. Labels are auto-formatted (e.g. snake_case → Snake Case). */
export const getEnumOptions = (
	key: EnumCatalogKey,
	values?: EnumOptionValue[],
): SelectOption[] => {
	return getEnumValues(key, values).map((value) => ({
		value,
		label: formatFallbackLabel(value),
	}));
};
