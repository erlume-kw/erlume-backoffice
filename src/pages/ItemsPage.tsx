import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FilterBar } from "@/components/common/FilterBar";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type {
	Category,
	Drop,
	Item,
	Seller,
	SubCategory,
	User,
} from "@/types/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Tag } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function ItemsPage() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [selectedItem, setSelectedItem] = useState<Item | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingItem, setEditingItem] = useState<Item | null>(null);
	const [formStep, setFormStep] = useState(1);
	const [formCondition, setFormCondition] = useState("gently_used");
	const [formStatus, setFormStatus] = useState("available");
	const [formDropId, setFormDropId] = useState<string | undefined>(undefined);
	const [formSellerId, setFormSellerId] = useState("");
	const [sellerSearch, setSellerSearch] = useState("");
	const [formCategoryId, setFormCategoryId] = useState("");
	const [formSubCategoryId, setFormSubCategoryId] = useState<
		string | undefined
	>(undefined);
	const [formAuthenticatedAt, setFormAuthenticatedAt] = useState<
		Date | undefined
	>(undefined);
	const [formReturnDate, setFormReturnDate] = useState<Date | undefined>(
		undefined,
	);
	const [formBagBrand, setFormBagBrand] = useState("");
	const [bagBrandSearch, setBagBrandSearch] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
		[],
	);
	const loadDrops = useCallback(
		() => restApi.drops.getAll() as Promise<Drop[]>,
		[],
	);
	const loadCategories = useCallback(
		() => restApi.categories.getAll() as Promise<Category[]>,
		[],
	);
	const loadSubcategories = useCallback(
		() => restApi.subcategories.getAll() as Promise<SubCategory[]>,
		[],
	);
	const loadSellers = useCallback(
		() => restApi.sellers.getAll() as Promise<Seller[]>,
		[],
	);
	const loadUsers = useCallback(
		() => restApi.users.getAll() as Promise<User[]>,
		[],
	);
	const loadItemStatus = useCallback(
		() => restApi.enums.getByCategory("itemStatus"),
		[],
	);
	const loadItemCondition = useCallback(
		() => restApi.enums.getByCategory("itemCondition"),
		[],
	);
	const loadBagBrand = useCallback(
		() => restApi.enums.getByCategory("bagBrand"),
		[],
	);
	const { data: items, loading, error, reload } = useResourceList(loadItems);
	const { data: drops } = useResourceList<Drop>(loadDrops);
	const { data: categories } = useResourceList(loadCategories);
	const { data: subcategories } = useResourceList(loadSubcategories);
	const { data: sellers } = useResourceList(loadSellers);
	const { data: users } = useResourceList(loadUsers);
	const { data: itemStatus } = useResourceList(loadItemStatus);
	const { data: itemCondition } = useResourceList(loadItemCondition);
	const { data: bagBrand, error: bagBrandError, loading: bagBrandLoading } = useResourceList(loadBagBrand);
	const userLabelById = useMemo(
		() =>
			new Map(
				users.map((user) => [
					user._id,
					user.username || user.emailAddress || user._id,
				]),
			),
		[users],
	);
	const dropNameById = useMemo(
		() => new Map(drops.map((drop) => [drop._id, drop.name || drop._id])),
		[drops],
	);
	const categoryNameById = useMemo(
		() => new Map(categories.map((cat) => [cat._id, cat.name])),
		[categories],
	);
	const subCategoryNameById = useMemo(
		() => new Map(subcategories.map((sub) => [sub._id, sub.sub_cat_name])),
		[subcategories],
	);
	const sellerLabelById = useMemo(() => {
		return new Map(
			sellers.map((seller) => {
				const userId = seller.userId;
				if (typeof userId === "string") {
					return [
						seller._id,
						userLabelById.get(userId) ?? userId ?? seller._id,
					];
				}
				const candidate = userId as { username?: string; _id?: string };
				return [
					seller._id,
					candidate?.username ??
						(candidate?._id ? userLabelById.get(candidate._id) : undefined) ??
						candidate?._id ??
						seller._id,
				];
			}),
		);
	}, [sellers, userLabelById]);
	const getSellerId = (item: Item) => {
		const candidate = item as Item & { sellerId?: string };
		return candidate.sellerId ?? item.seller_id ?? "";
	};

	const columns: Column<Item>[] = [
		{
			key: "itemName",
			header: "Item",
			render: (item) => (
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
						<Tag className="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground">{item.itemName}</p>
						<p className="text-sm text-muted-foreground">{item.brandName}</p>
					</div>
				</div>
			),
		},
		{
			key: "basePrice",
			header: "Pricing",
			render: (item) => (
				<div>
					<p className="font-medium text-foreground">
						KD{" "}
						{typeof item.basePrice === "string"
							? Number(item.basePrice).toLocaleString()
							: String(item.basePrice)}
					</p>
					<p className="text-sm text-muted-foreground">Sale {item.saleRate}%</p>
				</div>
			),
		},
		{
			key: "condition",
			header: "Condition",
			render: (item) => <StatusBadge status={item.condition} />,
		},
		{
			key: "itemStatus",
			header: "Status",
			render: (item) => <StatusBadge status={item.itemStatus} />,
		},
		{
			key: "quantity",
			header: "Quantity",
			render: (item) => (
				<span className="text-muted-foreground">
					{typeof item.quantity === "number"
						? item.quantity
						: String(item.quantity ?? "")}
				</span>
			),
		},
		{
			key: "drop_id",
			header: "Drop",
			render: (item) => (
				<span className="text-muted-foreground">
					{(item.drop_id && dropNameById.get(item.drop_id)) || "—"}
				</span>
			),
		},
		{
			key: "seller_id",
			header: "Seller",
			render: (item) => (
				<span className="text-muted-foreground">
					{(getSellerId(item) && sellerLabelById.get(getSellerId(item))) || "—"}
				</span>
			),
		},
		{
			key: "uploadedAt",
			header: "Listed",
			render: (item) => (
				<span className="text-muted-foreground">
					{new Date(item.uploadedAt).toLocaleDateString()}
				</span>
			),
		},
	];

	const filteredItems = items.filter((item) => {
		const matchesSearch =
			search === "" ||
			(item.itemName ?? "").toLowerCase().includes(search.toLowerCase()) ||
			(item.brandName ?? "").toLowerCase().includes(search.toLowerCase());
		const matchesStatus = !filters.status || item.itemStatus === filters.status;
		const matchesCondition =
			!filters.condition || item.condition === filters.condition;
		const matchesDrop = !filters.dropId || item.drop_id === filters.dropId;
		const matchesAuth =
			!filters.authenticationStatus ||
			item.authenticationStatus === filters.authenticationStatus;
		const matchesReturn =
			!filters.returnStatus || item.returnStatus === filters.returnStatus;
		return (
			matchesSearch &&
			matchesStatus &&
			matchesCondition &&
			matchesDrop &&
			matchesAuth &&
			matchesReturn
		);
	});
	const itemStatusArray = Array.isArray(itemStatus) ? itemStatus : [];
	const itemConditionArray = Array.isArray(itemCondition) ? itemCondition : [];
	const itemStatusValues = getEnumValues("itemStatus", itemStatusArray);
	const itemStatusOptions = getEnumOptions("itemStatus", itemStatusValues);
	const itemConditionValues = getEnumValues(
		"itemCondition",
		itemConditionArray,
	);
	const itemConditionOptions = getEnumOptions(
		"itemCondition",
		itemConditionValues,
	);
	const bagBrandArray = Array.isArray(bagBrand) ? bagBrand : [];
	console.log("bagBrand data:", bagBrand, "bagBrandArray:", bagBrandArray);
	const bagBrandOptions = useMemo(() => {
		const options = bagBrandArray.map((value) => ({
			value: String(value),
			label: String(value)
				.replace(/_/g, " ")
				.replace(/\b\w/g, (letter) => letter.toUpperCase()),
		}));
		console.log("bagBrandOptions:", options);
		return options;
	}, [bagBrandArray]);
	const filteredBagBrands = useMemo(() => {
		if (!bagBrandSearch) {
			return bagBrandOptions;
		}
		const query = bagBrandSearch.toLowerCase();
		return bagBrandOptions.filter((option) =>
			option.label.toLowerCase().includes(query) ||
			option.value.toLowerCase().includes(query),
		);
	}, [bagBrandOptions, bagBrandSearch]);
	const activeSellers = useMemo(
		() => sellers.filter((seller) => !seller.isDeactivated),
		[sellers],
	);
	const filteredSellers = useMemo(() => {
		if (!sellerSearch) {
			return activeSellers;
		}
		const query = sellerSearch.toLowerCase();
		return activeSellers.filter((seller) => {
			const label =
				(sellerLabelById.get(seller._id) || "").toLowerCase() ||
				seller._id.toLowerCase();
			return (
				label.includes(query) ||
				seller._id.toLowerCase().includes(query) ||
				(seller.userId && typeof seller.userId === "string"
					? seller.userId.toLowerCase().includes(query)
					: false)
			);
		});
	}, [activeSellers, sellerLabelById, sellerSearch]);
	const filteredSubcategories = useMemo(() => {
		if (!formCategoryId) {
			return subcategories;
		}
		return subcategories.filter((sub) => sub.category_id === formCategoryId);
	}, [formCategoryId, subcategories]);
	const activeDrops = useMemo(
		() => drops.filter((drop) => drop.status === "active" || drop.status === "upcoming"),
		[drops],
	);

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.items.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete item", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const basePrice = String(formData.get("basePrice") ?? "").trim();
		const saleRate = String(formData.get("saleRate") ?? "").trim();
		const quantity = String(formData.get("quantity") ?? "").trim();
		const yearValue = String(formData.get("year") ?? "").trim();
		const listingPriceValue = String(formData.get("listingPrice") ?? "").trim();
		const imageUrls = String(formData.get("imageUrls") || "")
			.split(/\s+/)
			.map((value) => value.trim())
			.filter(Boolean);
		const receiptPhotoUrls = String(formData.get("receiptPhotoUrls") || "")
			.split(/\s+/)
			.map((value) => value.trim())
			.filter(Boolean);
		const priceEstimatorUrls = String(formData.get("priceEstimatorUrls") || "")
			.split(/\s+/)
			.map((value) => value.trim())
			.filter(Boolean);
		const quoteUrls = String(formData.get("quoteUrls") || "")
			.split(/\s+/)
			.map((value) => value.trim())
			.filter(Boolean);

		const payload: Record<string, unknown> = {
			itemName: String(formData.get("itemName") || "").trim(),
			brandName: String(formData.get("brandName") || "").trim(),
			bagBrand: formBagBrand || undefined,
			condition: formCondition,
			basePrice,
			saleRate,
			size: String(formData.get("size") || "").trim(),
			color: String(formData.get("color") || "").trim(),
			itemModel: String(formData.get("itemModel") || "").trim() || undefined,
			year: yearValue || undefined,
			quantity,
			itemStatus: formStatus,
			category_id: formCategoryId,
			sub_category_id: formSubCategoryId || undefined,
			drop_id: formDropId || undefined,
			seller_id: formSellerId || undefined,
			imageUrls,
			receiptPhotoUrls: receiptPhotoUrls.length ? receiptPhotoUrls : undefined,
			priceEstimatorUrls: priceEstimatorUrls.length
				? priceEstimatorUrls
				: undefined,
			quoteUrls: quoteUrls.length ? quoteUrls : undefined,
			approved: formData.get("approved") === "on",
			approvedNextDrop: formData.get("approvedNextDrop") === "on",
			authNeeded: formData.get("authNeeded") === "on",
			cleaningNeeded: formData.get("cleaningNeeded") === "on",
			listingPrice: listingPriceValue,
			photographed: formData.get("photographed") === "on",
			authenticationStatus:
				String(formData.get("authenticationStatus") || "").trim() || undefined,
			authenticatedAt: formAuthenticatedAt
				? formAuthenticatedAt.toISOString()
				: undefined,
			returnDate: formReturnDate
				? formReturnDate.toISOString().slice(0, 10)
				: undefined,
			returnStatus:
				String(formData.get("returnStatus") || "").trim() || undefined,
			uploadedAt: editingItem?.uploadedAt ?? new Date().toISOString(),
			orderId: String(formData.get("orderId") || "").trim() || undefined,
		};
		// Remove undefined values so API receives only set fields
		Object.keys(payload).forEach((key) => {
			if (payload[key] === undefined) delete payload[key];
		});

		setFormError(null);
		if (
			!payload.itemName ||
			!payload.brandName ||
			!basePrice ||
			!saleRate ||
			!payload.itemStatus ||
			!payload.condition ||
			!payload.color ||
			!payload.size ||
			!quantity ||
			!payload.uploadedAt ||
			!payload.category_id ||
			!listingPriceValue
		) {
			setFormError(
				"Please fill in all required fields (name, brand, price, sale rate, status, condition, color, size, quantity, category, listing price).",
			);
			return;
		}
		if (imageUrls.length === 0) {
			setFormError("Please add at least one image URL (e.g. Google Drive link).");
			return;
		}

		try {
			if (editingItem) {
				await restApi.items.update(editingItem._id, payload as Partial<Item>);
			} else {
				await restApi.items.create(
					payload as Omit<Item, "_id" | "createdAt" | "updatedAt">,
				);
			}
			await reload();
			setShowForm(false);
			setEditingItem(null);
			setFormAuthenticatedAt(undefined);
			setFormReturnDate(undefined);
			setFormBagBrand("");
			setBagBrandSearch("");
			setFormError(null);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save item";
			setFormError(message);
			console.error("Failed to save item", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Items"
				description="Manage marketplace listings and inventory"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search items..."
				onAdd={() => {
					setEditingItem(null);
					setFormAuthenticatedAt(undefined);
					setFormReturnDate(undefined);
					setFormError(null);
					setFormStep(1);
					setFormCondition("gently_used");
					setFormStatus("available");
					setFormDropId(undefined);
					setFormSellerId("");
					setSellerSearch("");
					setFormCategoryId("");
					setFormSubCategoryId(undefined);
					setFormBagBrand("");
					setBagBrandSearch("");
					setShowForm(true);
				}}
				addLabel="Add Item"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading items..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<FilterBar
					filters={[
						{
							key: "status",
							label: "Status",
							value: filters.status,
							options: itemStatusOptions,
						},
						{
							key: "condition",
							label: "Condition",
							value: filters.condition,
							options: itemConditionOptions,
						},
						{
							key: "authenticationStatus",
							label: "Auth",
							value: filters.authenticationStatus,
							options: [
								{ value: "pending", label: "Pending" },
								{ value: "authentic", label: "Authentic" },
								{ value: "not_authentic", label: "Not authentic" },
							],
						},
						{
							key: "returnStatus",
							label: "Return",
							value: filters.returnStatus,
							options: [
								{ value: "pending", label: "Pending" },
								{ value: "scheduled", label: "Scheduled" },
								{ value: "returned", label: "Returned" },
								{ value: "not_returned", label: "Not returned" },
							],
						},
						{
							key: "dropId",
							label: "Drop",
							value: filters.dropId,
							options: drops.map((drop) => ({
								value: drop._id,
								label: drop.name || drop._id,
							})),
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() => setFilters({})}
				/>

				<DataTable
					data={filteredItems}
					columns={columns}
					keyExtractor={(item) => item._id}
					onView={(item) => setSelectedItem(item)}
					onEdit={(item) => {
						setEditingItem(item);
						setFormAuthenticatedAt(
							item.authenticatedAt
								? new Date(item.authenticatedAt)
								: undefined,
						);
						setFormReturnDate(
							item.returnDate ? new Date(item.returnDate) : undefined,
						);
						setFormStep(1);
						setFormCondition(item.condition);
						setFormBagBrand((item as Item & { bagBrand?: string }).bagBrand || "");
						setBagBrandSearch("");
						setFormStatus(item.itemStatus);
						setFormDropId(item.drop_id);
						setFormSellerId(getSellerId(item));
						setSellerSearch("");
						setFormCategoryId(item.category_id);
						setFormSubCategoryId(item.sub_category_id ?? undefined);
						setShowForm(true);
					}}
					onDelete={(item) => {
						void handleDelete(item._id);
					}}
				/>
			</div>

			{/* View Item Panel */}
			<DetailPanel
				open={!!selectedItem}
				onClose={() => setSelectedItem(null)}
				title="Item Details"
				description={selectedItem?.itemName}>
				{selectedItem && (
					<div className="space-y-6">
						<div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
							{selectedItem.imageUrls?.length ? (
								<img
									src={selectedItem.imageUrls[0]}
									alt={selectedItem.itemName}
									className="w-full h-full object-contain"
								/>
							) : (
								<Tag className="h-12 w-12 text-muted-foreground" />
							)}
						</div>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold">
									{selectedItem.itemName}
								</h3>
								<p className="text-muted-foreground">
									{selectedItem.brandName}
								</p>
							</div>
							<StatusBadge status={selectedItem.itemStatus} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Base Price</p>
								<p className="text-lg font-semibold">
									KD{" "}
									{typeof selectedItem.basePrice === "string"
										? Number(selectedItem.basePrice).toLocaleString()
										: String(selectedItem.basePrice)}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Condition</p>
								<StatusBadge status={selectedItem.condition} />
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Uploaded</p>
								<p className="font-medium">
									{selectedItem.uploadedAt
										? new Date(selectedItem.uploadedAt).toLocaleString()
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Sale Rate</p>
								<p className="text-lg font-semibold">
									{selectedItem.saleRate}%
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Item Status</p>
								<StatusBadge status={selectedItem.itemStatus} />
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Color</p>
								<p className="font-medium">{selectedItem.color || "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Size</p>
								<p className="font-medium">{selectedItem.size || "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Quantity</p>
								<p className="font-medium">{selectedItem.quantity}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Brand</p>
								<p className="font-medium">{selectedItem.brandName || "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-sm text-muted-foreground">Image URLs</p>
								<p className="text-xs break-all">
									{selectedItem.imageUrls?.length
										? selectedItem.imageUrls.join(", ")
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Category</p>
								<p className="font-medium">
									{categoryNameById.get(selectedItem.category_id) ??
										selectedItem.category_id ??
										"—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Subcategory</p>
								<p className="font-medium">
									{selectedItem.sub_category_id
										? subCategoryNameById.get(selectedItem.sub_category_id) ??
										  selectedItem.sub_category_id
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Drop</p>
								<p className="font-medium">
									{selectedItem.drop_id
										? dropNameById.get(selectedItem.drop_id) ??
										  selectedItem.drop_id
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Seller</p>
								<p className="font-medium">
									{getSellerId(selectedItem)
										? sellerLabelById.get(getSellerId(selectedItem)) ??
										  getSellerId(selectedItem)
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Model</p>
								<p className="font-medium">{selectedItem.itemModel || "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Year</p>
								<p className="font-medium">{selectedItem.year ?? "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Listing Price</p>
								<p className="font-medium">
									{selectedItem.listingPrice ?? "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Order ID</p>
								<p className="font-medium text-xs break-all">
									{selectedItem.orderId ?? "—"}
								</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">
									Authentication Status
								</p>
								<p className="font-medium">
									{selectedItem.authenticationStatus ?? "—"}
								</p>
								{selectedItem.authenticatedAt && (
									<p className="text-xs text-muted-foreground mt-1">
										Authenticated:{" "}
										{new Date(selectedItem.authenticatedAt).toLocaleString()}
									</p>
								)}
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Return Status</p>
								<p className="font-medium">
									{selectedItem.returnStatus ?? "—"}
								</p>
								{selectedItem.returnDate && (
									<p className="text-xs text-muted-foreground mt-1">
										Return date:{" "}
										{new Date(selectedItem.returnDate).toLocaleDateString()}
									</p>
								)}
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2 space-y-2">
								<p className="text-sm text-muted-foreground">Flags</p>
								<div className="flex flex-wrap gap-4">
									<label className="flex items-center gap-2 text-sm cursor-default">
										<Checkbox
											checked={Boolean(selectedItem.approved)}
											disabled
											className="pointer-events-none"
										/>
										Approved
									</label>
									<label className="flex items-center gap-2 text-sm cursor-default">
										<Checkbox
											checked={Boolean(selectedItem.approvedNextDrop)}
											disabled
											className="pointer-events-none"
										/>
										Approved Next Drop
									</label>
									<label className="flex items-center gap-2 text-sm cursor-default">
										<Checkbox
											checked={Boolean(selectedItem.authNeeded)}
											disabled
											className="pointer-events-none"
										/>
										Auth Needed
									</label>
									<label className="flex items-center gap-2 text-sm cursor-default">
										<Checkbox
											checked={Boolean(selectedItem.cleaningNeeded)}
											disabled
											className="pointer-events-none"
										/>
										Cleaning Needed
									</label>
									<label className="flex items-center gap-2 text-sm cursor-default">
										<Checkbox
											checked={Boolean(selectedItem.photographed)}
											disabled
											className="pointer-events-none"
										/>
										Photographed
									</label>
								</div>
							</div>
							{selectedItem.receiptPhotoUrls?.length ? (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-sm text-muted-foreground">
										Receipt Photos
									</p>
									<p className="text-xs break-all">
										{selectedItem.receiptPhotoUrls.join(" ")}
									</p>
								</div>
							) : null}
							{selectedItem.priceEstimatorUrls?.length ? (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-sm text-muted-foreground">
										Price Estimator URLs
									</p>
									<p className="text-xs break-all">
										{selectedItem.priceEstimatorUrls.join(" ")}
									</p>
								</div>
							) : null}
							{selectedItem.quoteUrls?.length ? (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-sm text-muted-foreground">Quote URLs</p>
									<p className="text-xs break-all">
										{selectedItem.quoteUrls.join(" ")}
									</p>
								</div>
							) : null}
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Created</p>
								<p className="font-medium">
									{selectedItem.createdAt
										? new Date(selectedItem.createdAt).toLocaleString()
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-sm text-muted-foreground">Updated</p>
								<p className="font-medium">
									{selectedItem.updatedAt
										? new Date(selectedItem.updatedAt).toLocaleString()
										: "—"}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingItem(selectedItem);
								setFormAuthenticatedAt(
									selectedItem.authenticatedAt
										? new Date(selectedItem.authenticatedAt)
										: undefined,
								);
								setFormReturnDate(
									selectedItem.returnDate
										? new Date(selectedItem.returnDate)
										: undefined,
								);
								setFormBagBrand((selectedItem as Item & { bagBrand?: string }).bagBrand || "");
								setBagBrandSearch("");
								setFormError(null);
								setFormStep(1);
								setFormCondition(selectedItem.condition);
								setFormStatus(selectedItem.itemStatus);
								setFormDropId(selectedItem.drop_id);
								setFormSellerId(getSellerId(selectedItem));
								setSellerSearch("");
								setFormCategoryId(selectedItem.category_id);
								setFormSubCategoryId(selectedItem.sub_category_id ?? undefined);
								setShowForm(true);
								setSelectedItem(null);
							}}>
							Edit Item
						</Button>
					</div>
				)}
			</DetailPanel>

			{/* Add/Edit Item Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingItem(null);
					setFormAuthenticatedAt(undefined);
					setFormReturnDate(undefined);
					setFormError(null);
					setFormSellerId("");
					setSellerSearch("");
					setFormCategoryId("");
					setFormSubCategoryId(undefined);
					setFormBagBrand("");
					setBagBrandSearch("");
					setFormStep(1);
				}}
				title={editingItem ? "Edit Item" : "Add Item"}
				type="dialog"
				size="lg">
				<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
					<>
						{formError && (
							<div className="text-sm text-destructive rounded-md bg-destructive/10 p-2">
								{formError}
							</div>
						)}

						{/* Step progress & navigation */}
						<div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
							<div className="flex items-center justify-between gap-2">
								<span className="text-sm font-medium">
									Step {formStep} of 5
								</span>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={formStep === 1}
										onClick={() =>
											setFormStep((prev) => Math.max(1, prev - 1))
										}>
										Back
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={formStep === 5}
										onClick={() =>
											setFormStep((prev) => Math.min(5, prev + 1))
										}>
										Next
									</Button>
								</div>
							</div>
							<div className="flex gap-1">
								{[1, 2, 3, 4, 5].map((step) => (
									<button
										key={step}
										type="button"
										onClick={() => setFormStep(step)}
										className={`h-2 flex-1 rounded-full transition-colors ${
											formStep === step
												? "bg-primary"
												: step < formStep
												? "bg-primary/50"
												: "bg-muted"
										}`}
										title={`Step ${step}`}
										aria-label={`Go to step ${step}`}
									/>
								))}
							</div>
							<p className="text-xs text-muted-foreground">
								{formStep === 1 && "Basics — Name, brand, category"}
								{formStep === 2 && "Pricing — Price, status, quantity"}
								{formStep === 3 && "Details — Condition, size, color"}
								{formStep === 4 && "Assignment — Seller & drop"}
								{formStep === 5 && "Media, flags & authentication"}
							</p>
						</div>

						{/* Scrollable step content */}

						<div className="min-h-0 max-h-[60vh] overflow-y-auto pr-1 -mr-1 space-y-4">
							<div className={formStep !== 1 ? "hidden" : undefined}>
								<div className="space-y-2">
									<Label htmlFor="itemName">Item Name</Label>
									<Input
										id="itemName"
										name="itemName"
										defaultValue={editingItem?.itemName}
										placeholder="Classic Jacket"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="brandName">Brand</Label>
									<Input
										id="brandName"
										name="brandName"
										defaultValue={editingItem?.brandName}
										placeholder="BrandX"
									/>
								</div>
								<div className="space-y-2">
									<Label>Bag Brand</Label>
									{bagBrandError && (
										<p className="text-xs text-destructive">
											Failed to load bag brands: {String(bagBrandError)}
										</p>
									)}
									{bagBrandLoading && (
										<p className="text-xs text-muted-foreground">
											Loading bag brands...
										</p>
									)}
									<Input
										value={bagBrandSearch}
										onChange={(event) => setBagBrandSearch(event.target.value)}
										placeholder="Search bag brands..."
										disabled={bagBrandLoading}
									/>
									<Select
										value={formBagBrand || "none"}
										onValueChange={(value) =>
											setFormBagBrand(value === "none" ? "" : value)
										}
										disabled={bagBrandLoading}>
										<SelectTrigger>
											<SelectValue placeholder="Select bag brand" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No bag brand</SelectItem>
											{bagBrandLoading && (
												<SelectItem value="__loading__" disabled>
													Loading...
												</SelectItem>
											)}
											{!bagBrandLoading && filteredBagBrands.length === 0 && (
												<SelectItem value="__none__" disabled>
													{bagBrandError ? "Error loading bag brands" : "No bag brands found"}
												</SelectItem>
											)}
											{filteredBagBrands.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Category</Label>
										<Select
											value={formCategoryId || "__placeholder__"}
											onValueChange={(value) => {
												setFormCategoryId(
													value === "__placeholder__" ? "" : value,
												);
												setFormSubCategoryId(undefined);
											}}>
											<SelectTrigger>
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__placeholder__">
													Select category
												</SelectItem>
												{categories.length === 0 && (
													<SelectItem value="__none__" disabled>
														No categories found
													</SelectItem>
												)}
												{categories.map((cat) => (
													<SelectItem key={cat._id} value={cat._id}>
														{categoryNameById.get(cat._id) ?? cat._id}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Subcategory</Label>
										<Select
											value={formSubCategoryId || "none"}
											onValueChange={(value) =>
												setFormSubCategoryId(
													value === "none" ? undefined : value,
												)
											}>
											<SelectTrigger>
												<SelectValue placeholder="Select subcategory" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">No subcategory</SelectItem>
												{filteredSubcategories.length === 0 && (
													<SelectItem value="__none__" disabled>
														No subcategories found
													</SelectItem>
												)}
												{filteredSubcategories.map((sub) => (
													<SelectItem key={sub._id} value={sub._id}>
														{subCategoryNameById.get(sub._id) ?? sub._id}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							<div className={formStep !== 2 ? "hidden" : undefined}>
								<p className="text-xs text-muted-foreground mb-3">
									Whole numbers (90) or decimals (90.99) are both fine — no fixed format required.
								</p>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="basePrice">Base Price</Label>
										<Input
											id="basePrice"
											name="basePrice"
											type="number"
											inputMode="decimal"
											step="any"
											min="0"
											defaultValue={editingItem?.basePrice}
											placeholder="e.g. 90"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="saleRate">Sale Rate (%)</Label>
										<Input
											id="saleRate"
											name="saleRate"
											type="number"
											min="0"
											max="100"
											step="any"
											defaultValue={editingItem?.saleRate}
											placeholder="e.g. 20 for 20%"
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="status">Status</Label>
										<Select
											value={
												itemStatusOptions.some((o) => o.value === formStatus)
													? formStatus
													: itemStatusValues[0] ?? "available"
											}
											onValueChange={(value) => setFormStatus(value)}>
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												{itemStatusOptions.map(({ value, label }) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="quantity">Quantity</Label>
										<Input
											id="quantity"
											name="quantity"
											type="number"
											min="1"
											step="1"
											defaultValue={editingItem?.quantity}
											placeholder="e.g. 3"
										/>
									</div>
								</div>
								<div className="space-y-2 max-w-xs">
									<Label htmlFor="listingPrice">Listing price</Label>
									<Input
										id="listingPrice"
										name="listingPrice"
										type="number"
										inputMode="decimal"
										step="any"
										min="0"
										required
										defaultValue={editingItem?.listingPrice ?? ""}
										placeholder="e.g. 90"
									/>
								</div>
							</div>

							<div className={formStep !== 3 ? "hidden" : undefined}>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="condition">Condition</Label>
										<Select
											value={
												itemConditionOptions.some(
													(o) => o.value === formCondition,
												)
													? formCondition
													: itemConditionValues[0] ?? "gently_used"
											}
											onValueChange={(value) => setFormCondition(value)}>
											<SelectTrigger>
												<SelectValue placeholder="Select condition" />
											</SelectTrigger>
											<SelectContent>
												{itemConditionOptions.map(({ value, label }) => (
													<SelectItem key={value} value={value}>
														{label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="size">Size</Label>
										<Input
											id="size"
											name="size"
											defaultValue={editingItem?.size}
											placeholder="M"
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="color">Color</Label>
										<Input
											id="color"
											name="color"
											defaultValue={editingItem?.color}
											placeholder="Black"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="itemModel">Model</Label>
										<Input
											id="itemModel"
											name="itemModel"
											defaultValue={editingItem?.itemModel}
											placeholder="Optional"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="year">Year</Label>
									<Input
										id="year"
										name="year"
										type="number"
										defaultValue={editingItem?.year}
										placeholder="Year"
									/>
								</div>
							</div>

							<div className={formStep !== 4 ? "hidden" : undefined}>
								<div className="space-y-2">
									<Label>Seller</Label>
									<Input
										value={sellerSearch}
										onChange={(event) => setSellerSearch(event.target.value)}
										placeholder="Search sellers..."
									/>
									<Select
										value={formSellerId || "none"}
										onValueChange={(value) =>
											setFormSellerId(value === "none" ? "" : value)
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select seller" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No seller</SelectItem>
											{filteredSellers.length === 0 && (
												<SelectItem value="__none__" disabled>
													No sellers found
												</SelectItem>
											)}
											{filteredSellers.map((seller) => (
												<SelectItem key={seller._id} value={seller._id}>
													{sellerLabelById.get(seller._id) ?? seller._id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Drop (optional)</Label>
									<Select
										value={formDropId || "none"}
										onValueChange={(value) =>
											setFormDropId(value === "none" ? undefined : value)
										}>
										<SelectTrigger>
											<SelectValue placeholder="Select drop" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No drop</SelectItem>
											{activeDrops.map((drop) => (
												<SelectItem key={drop._id} value={drop._id}>
													{drop.name || drop._id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className={formStep !== 5 ? "hidden" : undefined}>
								<p className="text-sm font-medium text-muted-foreground mb-3">
									Step 5: Media, flags & authentication
								</p>

								{/* Section 1: Media & URLs */}
								<Card className="mb-4">
									<CardHeader className="py-3 px-4">
										<CardTitle className="text-base">Media & URLs</CardTitle>
										<p className="text-xs text-muted-foreground mt-0.5">
											Paste image or Google Drive links (one per line).
										</p>
									</CardHeader>
									<CardContent className="pt-0 px-4 pb-4 space-y-4">
										<div className="space-y-2">
											<Label htmlFor="imageUrls">Image URLs</Label>
											<Textarea
												id="imageUrls"
												name="imageUrls"
												rows={3}
												defaultValue={editingItem?.imageUrls?.join("\n")}
												placeholder="Paste links (e.g. Google Drive share links), one per line or space-separated"
												className="resize-y min-h-[80px]"
											/>
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2 min-w-0">
												<Label htmlFor="receiptPhotoUrls" className="break-words">
													Receipt photo URLs
												</Label>
												<Input
													id="receiptPhotoUrls"
													name="receiptPhotoUrls"
													defaultValue={editingItem?.receiptPhotoUrls?.join(
														" ",
													)}
													placeholder="Space-separated"
												/>
											</div>
											<div className="space-y-2 min-w-0">
												<Label htmlFor="priceEstimatorUrls" className="break-words">
													Price estimator URLs
												</Label>
												<Input
													id="priceEstimatorUrls"
													name="priceEstimatorUrls"
													defaultValue={editingItem?.priceEstimatorUrls?.join(
														" ",
													)}
													placeholder="Space-separated"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="quoteUrls">Quote URLs</Label>
											<Input
												id="quoteUrls"
												name="quoteUrls"
												defaultValue={editingItem?.quoteUrls?.join(" ")}
												placeholder="Space-separated"
											/>
										</div>
									</CardContent>
								</Card>

								{/* Section 2: Flags */}
								<Card className="mb-4">
									<CardHeader className="py-3 px-4">
										<CardTitle className="text-base">Flags</CardTitle>
										<p className="text-xs text-muted-foreground mt-0.5">
											Approval, authentication, cleaning, photography
										</p>
									</CardHeader>
									<CardContent className="pt-0 px-4 pb-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<label className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-muted/50">
												<input
													type="checkbox"
													name="approved"
													defaultChecked={editingItem?.approved}
													className="h-4 w-4 rounded border-input"
												/>
												<span>Approved</span>
											</label>
											<label className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-muted/50">
												<input
													type="checkbox"
													name="approvedNextDrop"
													defaultChecked={editingItem?.approvedNextDrop}
													className="h-4 w-4 rounded border-input"
												/>
												<span>Approved Next Drop</span>
											</label>
											<label className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-muted/50">
												<input
													type="checkbox"
													name="authNeeded"
													defaultChecked={editingItem?.authNeeded}
													className="h-4 w-4 rounded border-input"
												/>
												<span>Authentication Needed</span>
											</label>
											<label className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-muted/50">
												<input
													type="checkbox"
													name="cleaningNeeded"
													defaultChecked={editingItem?.cleaningNeeded}
													className="h-4 w-4 rounded border-input"
												/>
												<span>Cleaning Needed</span>
											</label>
											<label className="flex items-center gap-2 text-sm cursor-pointer rounded-md p-2 hover:bg-muted/50 sm:col-span-2">
												<input
													type="checkbox"
													name="photographed"
													defaultChecked={editingItem?.photographed}
													className="h-4 w-4 rounded border-input"
												/>
												<span>Photographed</span>
											</label>
										</div>
									</CardContent>
								</Card>

								{/* Section 3: Authentication & return */}
								<Card>
									<CardHeader className="py-3 px-4">
										<CardTitle className="text-base">
											Authentication & return
										</CardTitle>
										<p className="text-xs text-muted-foreground mt-0.5">
											Auth status, dates, return tracking
										</p>
									</CardHeader>
									<CardContent className="pt-0 px-4 pb-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="authenticationStatus">
													Auth status
												</Label>
												<select
													id="authenticationStatus"
													name="authenticationStatus"
													className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
													defaultValue={
														editingItem?.authenticationStatus ?? ""
													}>
													<option value="">—</option>
													<option value="pending">Pending</option>
													<option value="authentic">Authentic</option>
													<option value="not_authentic">Not authentic</option>
												</select>
											</div>
											<div className="space-y-2">
												<Label>Authenticated at</Label>
												<DatePicker
													value={formAuthenticatedAt}
													onChange={setFormAuthenticatedAt}
													placeholder="Select date"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="returnStatus">Return status</Label>
												<select
													id="returnStatus"
													name="returnStatus"
													className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
													defaultValue={editingItem?.returnStatus ?? ""}>
													<option value="">—</option>
													<option value="pending">Pending</option>
													<option value="scheduled">Scheduled</option>
													<option value="returned">Returned</option>
													<option value="not_returned">Not returned</option>
												</select>
											</div>
											<div className="space-y-2">
												<Label>Return date</Label>
												<DatePicker
													value={formReturnDate}
													onChange={setFormReturnDate}
													placeholder="Select date"
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>

						<div className="flex gap-3 pt-4 border-t border-border shrink-0">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => {
									setShowForm(false);
									setEditingItem(null);
									setFormAuthenticatedAt(undefined);
									setFormReturnDate(undefined);
									setFormSellerId("");
									setSellerSearch("");
									setFormCategoryId("");
									setFormSubCategoryId(undefined);
									setFormBagBrand("");
									setBagBrandSearch("");
									setFormStep(1);
								}}>
								Cancel
							</Button>
							<Button type="submit" className="flex-1">
								{editingItem ? "Save Changes" : "Add Item"}
							</Button>
						</div>
					</>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}
