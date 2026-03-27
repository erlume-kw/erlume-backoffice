import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Item, Order, OrderItem, Sale, Transaction } from "@/types/models";
import { FileText } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function SalesPage() {
	const getRefId = (value: unknown): string => {
		if (typeof value === "string") return value;
		if (value && typeof value === "object") {
			const record = value as Record<string, unknown>;
			if (typeof record._id === "string") return record._id;
		}
		return "";
	};
	const getCommissionValue = (sale: Sale): string => {
		const candidate = sale as Sale & {
			erlumeCommissionAmount?: string;
			erlume_commission?: string;
		};
		return (
			sale.erlumeCommission ??
			candidate.erlumeCommissionAmount ??
			candidate.erlume_commission ??
			""
		);
	};
	const getSellerPayoutValue = (sale: Sale): string => {
		const candidate = sale as Sale & {
			sellerPayoutAmount?: string;
			seller_payout?: string;
		};
		return (
			sale.sellerPayout ??
			candidate.sellerPayoutAmount ??
			candidate.seller_payout ??
			""
		);
	};
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingSale, setEditingSale] = useState<Sale | null>(null);
	const [formOrderId, setFormOrderId] = useState("");
	const [formOrderItemId, setFormOrderItemId] = useState("");
	const [formTransactionId, setFormTransactionId] = useState("");
	const [formItemId, setFormItemId] = useState("");
	const [formFlow, setFormFlow] = useState<"order" | "prelaunch">("order");
	const [formAmount, setFormAmount] = useState("");
	const [formListingPrice, setFormListingPrice] = useState("");
	const [formErlumeCommission, setFormErlumeCommission] = useState("");
	const [formSellerPayout, setFormSellerPayout] = useState("");
	const [formBuyer, setFormBuyer] = useState("");
	const [formSaleStatus, setFormSaleStatus] = useState("");
	const [formSaleDate, setFormSaleDate] = useState("");
	const [formBagRecord, setFormBagRecord] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);

	const loadSales = useCallback(() => {
		if (filters.orderId) {
			return restApi.salesExtra.getByOrderId(filters.orderId);
		}
		return restApi.sales.getAll() as Promise<Sale[]>;
	}, [filters.orderId]);
	const loadOrders = useCallback(
		() => restApi.orders.getAll() as Promise<Order[]>,
		[],
	);
	const loadOrderItems = useCallback(
		() => restApi.orderitems.getAll() as Promise<OrderItem[]>,
		[],
	);
	const loadTransactions = useCallback(
		() => restApi.transactions.getAll() as Promise<Transaction[]>,
		[],
	);
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
		[],
	);

	const {
		data: salesData,
		loading,
		error,
		reload,
	} = useResourceList(loadSales);
	const { data: ordersData } = useResourceList(loadOrders);
	const { data: orderItemsData } = useResourceList(loadOrderItems);
	const { data: transactionsData } = useResourceList(loadTransactions);
	const { data: itemsData } = useResourceList(loadItems);

	const safeSales = Array.isArray(salesData) ? salesData : [];
	const safeOrders = Array.isArray(ordersData) ? ordersData : [];
	const safeOrderItems = Array.isArray(orderItemsData) ? orderItemsData : [];
	const safeTransactions = Array.isArray(transactionsData)
		? transactionsData
		: [];
	const safeItems = Array.isArray(itemsData) ? itemsData : [];

	const orderLabelById = useMemo(
		() =>
			new Map(
				safeOrders.map((o) => [
					o._id,
					`${o._id.slice(-6)} · ${o.order_status ?? ""}`,
				]),
			),
		[safeOrders],
	);
	const orderItemLabelById = useMemo(
		() =>
			new Map(
				safeOrderItems.map((oi) => [
					oi._id,
					`${oi._id.slice(-6)} · qty ${oi.quantity}`,
				]),
			),
		[safeOrderItems],
	);
	const transactionLabelById = useMemo(
		() =>
			new Map(
				safeTransactions.map((t) => [
					t._id,
					`${t._id.slice(-6)} · KD ${Number(t.amount ?? 0).toFixed(2)}`,
				]),
			),
		[safeTransactions],
	);
	const itemLabelById = useMemo(
		() =>
			new Map(
				safeItems.map((i) => [
					i._id,
					[i.itemName, i.brandName].filter(Boolean).join(" · ") || i._id,
				]),
			),
		[safeItems],
	);
	const itemById = useMemo(
		() => new Map(safeItems.map((item) => [item._id, item])),
		[safeItems],
	);
	const orderItemById = useMemo(
		() => new Map(safeOrderItems.map((oi) => [oi._id, oi])),
		[safeOrderItems],
	);
	const getOrderLabel = (value: unknown): string => {
		const id = getRefId(value);
		if (!id) return "—";
		return orderLabelById.get(id) ?? id;
	};
	const getOrderItemLabel = (value: unknown): string => {
		const id = getRefId(value);
		if (!id) return "—";
		return orderItemLabelById.get(id) ?? id;
	};
	const getTransactionLabel = (value: unknown): string => {
		const id = getRefId(value);
		if (!id) return "—";
		return transactionLabelById.get(id) ?? id;
	};
	const getNormalizedRate = (rawRate: string): number | null => {
		const parsed = Number(rawRate);
		if (!Number.isFinite(parsed) || parsed < 0) return null;
		return parsed > 1 ? parsed / 100 : parsed;
	};
	const getSaleLinkedItemId = (sale: Sale): string => {
		const direct = getRefId(sale.item_id);
		if (direct) return direct;
		const orderItemId = getRefId(sale.order_item_id);
		if (!orderItemId) return "";
		const orderItem = orderItemById.get(orderItemId);
		if (!orderItem) return "";
		return getRefId(orderItem.item_id);
	};
	const computeCommissionFromSaleRate = (sale: Sale): string => {
		const amount = Number(sale.amount ?? "");
		if (!Number.isFinite(amount) || amount < 0) return "";
		const itemId = getSaleLinkedItemId(sale);
		if (!itemId) return "";
		const item = itemById.get(itemId);
		if (!item || !item.saleRate) return "";
		const rate = getNormalizedRate(String(item.saleRate));
		if (rate == null) return "";
		return (amount * rate).toFixed(2);
	};
	const computeSellerPayoutFromSaleRate = (sale: Sale): string => {
		const amount = Number(sale.amount ?? "");
		if (!Number.isFinite(amount) || amount < 0) return "";
		const itemId = getSaleLinkedItemId(sale);
		if (!itemId) return "";
		const item = itemById.get(itemId);
		if (!item || !item.saleRate) return "";
		const rate = getNormalizedRate(String(item.saleRate));
		if (rate == null) return "";
		return (amount * (1 - rate)).toFixed(2);
	};
	const getDisplayCommission = (sale: Sale): string => {
		const explicit = getCommissionValue(sale);
		return explicit || computeCommissionFromSaleRate(sale);
	};
	const getDisplaySellerPayout = (sale: Sale): string => {
		const explicit = getSellerPayoutValue(sale);
		return explicit || computeSellerPayoutFromSaleRate(sale);
	};

	const orderItemsByOrder = useMemo(() => {
		const map = new Map<string, OrderItem[]>();
		safeOrderItems.forEach((oi) => {
			const orderId = getRefId(oi.order_id);
			if (!orderId) return;
			const list = map.get(orderId) ?? [];
			list.push(oi);
			map.set(orderId, list);
		});
		return map;
	}, [safeOrderItems]);

	const filteredSales = useMemo(() => {
		if (!search.trim()) return safeSales;
		const q = search.toLowerCase();
		return safeSales.filter(
			(s) =>
				getRefId(s.order_id).toLowerCase().includes(q) ||
				(s.invoice_number ?? "").toLowerCase().includes(q) ||
				(s.buyer ?? "").toLowerCase().includes(q) ||
				(s.bag_record ?? "").toLowerCase().includes(q),
		);
	}, [safeSales, search]);

	const columns: Column<Sale>[] = [
		{
			key: "_select",
			header: (
				<Checkbox
					checked={
						filteredSales.length > 0 &&
						filteredSales.every((s) => selectedIds.includes(s._id))
					}
					onCheckedChange={(v) => {
						if (v) setSelectedIds(filteredSales.map((s) => s._id));
						else setSelectedIds([]);
					}}
				/>
			),
			render: (s) => (
				<Checkbox
					checked={selectedIds.includes(s._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, s._id] : prev.filter((id) => id !== s._id),
						);
					}}
				/>
			),
		},
		{
			key: "order_id",
			header: "Order",
			render: (s) => (
				<span className="text-sm">{getOrderLabel(s.order_id)}</span>
			),
		},
		{
			key: "order_item_id",
			header: "Order item",
			render: (s) => (
				<span className="text-sm">{getOrderItemLabel(s.order_item_id)}</span>
			),
		},
		{
			key: "transaction_id",
			header: "Transaction",
			render: (s) => (
				<span className="text-sm">{getTransactionLabel(s.transaction_id)}</span>
			),
		},
		{
			key: "invoice_number",
			header: "Invoice",
			render: (s) => (
				<span className="text-muted-foreground">{s.invoice_number ?? "—"}</span>
			),
		},
		{
			key: "amount",
			header: "Total",
			render: (s) => (
				<span className="text-muted-foreground">
					{s.amount ? `KD ${Number(s.amount).toFixed(2)}` : "—"}
				</span>
			),
		},
		{
			key: "erlumeCommission",
			header: "Erlume",
			render: (s) => (
				<span className="text-muted-foreground">
					{getDisplayCommission(s)
						? `KD ${Number(getDisplayCommission(s)).toFixed(2)}`
						: "—"}
				</span>
			),
		},
		{
			key: "sellerPayout",
			header: "Seller",
			render: (s) => (
				<span className="text-muted-foreground">
					{getDisplaySellerPayout(s)
						? `KD ${Number(getDisplaySellerPayout(s)).toFixed(2)}`
						: "—"}
				</span>
			),
		},
	];

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.sales.delete(id)));
			setSelectedIds([]);
			await reload();
		} catch (err) {
			console.error("Bulk delete failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.sales.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete sale", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const order_id = formOrderId || undefined;
		const order_item_id = formOrderItemId || undefined;
		const transaction_id = formTransactionId || undefined;
		const invoice_number = String(formData.get("invoice_number") ?? "").trim();
		const invoice_url = String(formData.get("invoice_url") ?? "").trim();
		const payment_evidence_url = String(
			formData.get("payment_evidence_url") ?? "",
		).trim();
		const amount = formAmount.trim() || undefined;
		const listingPrice = formListingPrice.trim() || undefined;
		const erlumeCommission = formErlumeCommission.trim() || undefined;
		const sellerPayout = formSellerPayout.trim() || undefined;
		const buyer = formBuyer.trim() || undefined;
		const status = formSaleStatus.trim() || undefined;
		const bag_record = formBagRecord.trim() || undefined;
		const sale_date = formSaleDate
			? new Date(formSaleDate).toISOString()
			: undefined;
		const item_id = formItemId || undefined;

		if (formFlow === "order" && (!order_id || !order_item_id)) {
			setFormError("Order and order item are required for order flow.");
			return;
		}
		if (formFlow === "prelaunch" && !amount && !bag_record) {
			setFormError(
				"For prelaunch flow, provide at least amount or bag record.",
			);
			return;
		}

		try {
			const payload: Partial<Sale> = {
				...(formFlow === "order" && order_id && { order_id }),
				...(formFlow === "order" && order_item_id && { order_item_id }),
				...(invoice_number && { invoice_number }),
				...(invoice_url && { invoice_url }),
				...(payment_evidence_url && { payment_evidence_url }),
				...(transaction_id && { transaction_id }),
				...(item_id && { item_id }),
				...(amount && { amount }),
				...(listingPrice && { listingPrice }),
				...(erlumeCommission && { erlumeCommission }),
				...(sellerPayout && { sellerPayout }),
				// Keep aliases for backend compatibility during rollout.
				...(erlumeCommission && { erlumeCommissionAmount: erlumeCommission }),
				...(sellerPayout && { sellerPayoutAmount: sellerPayout }),
				...(buyer && { buyer }),
				...(status && { status }),
				...(sale_date && { sale_date }),
				...(bag_record && { bag_record }),
			};
			if (editingSale) {
				await restApi.sales.update(editingSale._id, payload);
			} else {
				await restApi.sales.create(
					payload as Omit<Sale, "_id" | "createdAt" | "updatedAt">,
				);
			}
			await reload();
			setShowForm(false);
			setEditingSale(null);
			setFormOrderId("");
			setFormOrderItemId("");
			setFormTransactionId("");
			setFormItemId("");
			setFormAmount("");
			setFormListingPrice("");
			setFormErlumeCommission("");
			setFormSellerPayout("");
			setFormBuyer("");
			setFormSaleStatus("");
			setFormSaleDate("");
			setFormBagRecord("");
			setFormFlow("order");
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Failed to save sale");
			console.error("Failed to save sale", err);
		}
	};

	const availableOrderItems = formOrderId
		? (orderItemsByOrder.get(formOrderId) ?? [])
		: [];

	return (
		<AdminLayout>
			<PageHeader
				title="Sales"
				description="Sale breakdown source of truth: total, Erlume commission, and seller payout"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search sales..."
				onAdd={() => {
					setEditingSale(null);
					setFormFlow("order");
					setFormOrderId("");
					setFormOrderItemId("");
					setFormTransactionId("");
					setFormItemId("");
					setFormAmount("");
					setFormListingPrice("");
					setFormErlumeCommission("");
					setFormSellerPayout("");
					setFormBuyer("");
					setFormSaleStatus("");
					setFormSaleDate("");
					setFormBagRecord("");
					setFormError(null);
					setShowForm(true);
				}}
				addLabel="Add sale"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading..." : ""} {error ? String(error) : ""}
					</div>
				)}
				<FilterBar
					filters={[
						{
							key: "orderId",
							label: "Order",
							value: filters.orderId,
							options: [
								{ value: "", label: "All orders" },
								...safeOrders.map((o) => ({
									value: o._id,
									label: orderLabelById.get(o._id) ?? o._id,
								})),
							],
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() => setFilters({})}
				/>
				{selectedIds.length > 0 && (
					<div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 mb-2">
						<span className="text-xs font-medium text-muted-foreground">
							{selectedIds.length} selected
						</span>
						<div className="ml-auto">
							<Button
								variant="destructive"
								size="sm"
								className="h-8 text-xs"
								disabled={bulkLoading}
								onClick={() => void handleBulkDelete()}>
								Delete Selected
							</Button>
						</div>
					</div>
				)}
				<DataTable
					data={filteredSales}
					columns={columns}
					keyExtractor={(s) => s._id}
					onView={(s) => setSelectedSale(s)}
					onEdit={(s) => {
						setEditingSale(s);
						setFormFlow(
							getRefId(s.order_id) && getRefId(s.order_item_id)
								? "order"
								: "prelaunch",
						);
						setFormOrderId(getRefId(s.order_id));
						setFormOrderItemId(getRefId(s.order_item_id));
						setFormTransactionId(getRefId(s.transaction_id));
						setFormItemId(getRefId(s.item_id));
						setFormAmount(s.amount ?? "");
						setFormListingPrice(s.listingPrice ?? "");
						setFormErlumeCommission(getDisplayCommission(s));
						setFormSellerPayout(getDisplaySellerPayout(s));
						setFormBuyer(s.buyer ?? "");
						setFormSaleStatus(s.status ?? "");
						setFormSaleDate(
							s.sale_date
								? new Date(s.sale_date).toISOString().slice(0, 10)
								: "",
						);
						setFormBagRecord(s.bag_record ?? "");
						setFormError(null);
						setShowForm(true);
					}}
					onDelete={(s) => void handleDelete(s._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedSale}
				onClose={() => setSelectedSale(null)}
				title="Sale details"
				description={selectedSale?.invoice_number ?? selectedSale?._id}>
				{selectedSale && (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<div className="p-3 rounded-lg bg-muted">
								<FileText className="h-6 w-6 text-muted-foreground" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">
									{selectedSale.invoice_number ?? "Sale"}
								</h3>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Order</p>
								<p className="text-sm">
									{getOrderLabel(selectedSale.order_id)}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Order item</p>
								<p className="text-sm">
									{getOrderItemLabel(selectedSale.order_item_id)}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Prelaunch bag</p>
								<p className="text-sm">{selectedSale.bag_record || "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Buyer</p>
								<p className="text-sm">{selectedSale.buyer || "—"}</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-xs text-muted-foreground">Total</p>
								<p className="text-sm">
									{selectedSale.amount
										? `KD ${Number(selectedSale.amount).toFixed(2)}`
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-xs text-muted-foreground">
									Erlume commission
								</p>
								<p className="text-sm">
									{selectedSale.erlumeCommission
										? `KD ${Number(selectedSale.erlumeCommission).toFixed(2)}`
										: getDisplayCommission(selectedSale)
											? `KD ${Number(
													getDisplayCommission(selectedSale),
												).toFixed(2)}`
											: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Seller payout</p>
								<p className="text-sm">
									{selectedSale.sellerPayout
										? `KD ${Number(selectedSale.sellerPayout).toFixed(2)}`
										: getDisplaySellerPayout(selectedSale)
											? `KD ${Number(
													getDisplaySellerPayout(selectedSale),
												).toFixed(2)}`
											: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Transaction</p>
								<p className="text-sm">
									{getTransactionLabel(selectedSale.transaction_id)}
								</p>
							</div>
							{selectedSale.invoice_url && (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-xs text-muted-foreground">Invoice URL</p>
									<p className="text-sm break-all">
										{selectedSale.invoice_url}
									</p>
								</div>
							)}
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingSale(selectedSale);
								setFormFlow(
									getRefId(selectedSale.order_id) &&
										getRefId(selectedSale.order_item_id)
										? "order"
										: "prelaunch",
								);
								setFormOrderId(getRefId(selectedSale.order_id));
								setFormOrderItemId(getRefId(selectedSale.order_item_id));
								setFormTransactionId(getRefId(selectedSale.transaction_id));
								setFormItemId(getRefId(selectedSale.item_id));
								setFormAmount(selectedSale.amount ?? "");
								setFormListingPrice(selectedSale.listingPrice ?? "");
								setFormErlumeCommission(getDisplayCommission(selectedSale));
								setFormSellerPayout(getDisplaySellerPayout(selectedSale));
								setFormBuyer(selectedSale.buyer ?? "");
								setFormSaleStatus(selectedSale.status ?? "");
								setFormSaleDate(
									selectedSale.sale_date
										? new Date(selectedSale.sale_date)
												.toISOString()
												.slice(0, 10)
										: "",
								);
								setFormBagRecord(selectedSale.bag_record ?? "");
								setSelectedSale(null);
								setShowForm(true);
							}}>
							Edit sale
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingSale(null);
					setFormOrderId("");
					setFormOrderItemId("");
					setFormTransactionId("");
					setFormItemId("");
					setFormAmount("");
					setFormListingPrice("");
					setFormErlumeCommission("");
					setFormSellerPayout("");
					setFormBuyer("");
					setFormSaleStatus("");
					setFormSaleDate("");
					setFormBagRecord("");
					setFormFlow("order");
					setFormError(null);
				}}
				title={editingSale ? "Edit sale" : "Add sale"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="space-y-2">
						<Label>Flow</Label>
						<Select
							value={formFlow}
							onValueChange={(v) => {
								const next = v === "prelaunch" ? "prelaunch" : "order";
								setFormFlow(next);
								if (next === "prelaunch") {
									setFormOrderId("");
									setFormOrderItemId("");
								}
							}}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="order">Order flow</SelectItem>
								<SelectItem value="prelaunch">Prelaunch flow</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{formFlow === "order" && (
						<>
							<div className="space-y-2">
								<Label>Order *</Label>
								<Select
									value={formOrderId || "__none__"}
									onValueChange={(v) => {
										setFormOrderId(v === "__none__" ? "" : v);
										setFormOrderItemId("");
									}}>
									<SelectTrigger>
										<SelectValue placeholder="Select order" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">Select order</SelectItem>
										{safeOrders.map((o) => (
											<SelectItem key={o._id} value={o._id}>
												{orderLabelById.get(o._id) ?? o._id}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Order item *</Label>
								<Select
									value={formOrderItemId || "__none__"}
									onValueChange={(v) =>
										setFormOrderItemId(v === "__none__" ? "" : v)
									}>
									<SelectTrigger>
										<SelectValue placeholder="Select order item" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">Select order item</SelectItem>
										{availableOrderItems.map((oi) => (
											<SelectItem key={oi._id} value={oi._id}>
												{orderItemLabelById.get(oi._id) ?? oi._id}
											</SelectItem>
										))}
										{formOrderId && availableOrderItems.length === 0 && (
											<SelectItem value="__empty__" disabled>
												No order items for this order
											</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>
						</>
					)}
					{formFlow === "prelaunch" && (
						<>
							<div className="space-y-2">
								<Label htmlFor="bag_record">Bag record</Label>
								<Input
									id="bag_record"
									value={formBagRecord}
									onChange={(e) => setFormBagRecord(e.target.value)}
									placeholder="Name-Brand-Year"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="buyer">Buyer</Label>
								<Input
									id="buyer"
									value={formBuyer}
									onChange={(e) => setFormBuyer(e.target.value)}
									placeholder="Buyer name"
								/>
							</div>
							<div className="space-y-2">
								<Label>Item</Label>
								<Select
									value={formItemId || "__none__"}
									onValueChange={(v) =>
										setFormItemId(v === "__none__" ? "" : v)
									}>
									<SelectTrigger>
										<SelectValue placeholder="Optional item link" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">None</SelectItem>
										{safeItems.map((item) => (
											<SelectItem key={item._id} value={item._id}>
												{itemLabelById.get(item._id) ?? item._id}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="saleStatus">Status</Label>
								<Input
									id="saleStatus"
									value={formSaleStatus}
									onChange={(e) => setFormSaleStatus(e.target.value)}
									placeholder="Optional"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="saleDate">Sale date</Label>
								<Input
									id="saleDate"
									type="date"
									value={formSaleDate}
									onChange={(e) => setFormSaleDate(e.target.value)}
								/>
							</div>
						</>
					)}
					<div className="space-y-2">
						<Label htmlFor="amount">Total amount</Label>
						<Input
							id="amount"
							type="number"
							min={0}
							step="0.01"
							value={formAmount}
							onChange={(e) => setFormAmount(e.target.value)}
							placeholder="Gross total"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="listingPrice">Listing price</Label>
						<Input
							id="listingPrice"
							type="number"
							min={0}
							step="0.01"
							value={formListingPrice}
							onChange={(e) => setFormListingPrice(e.target.value)}
							placeholder="Optional"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="erlumeCommission">Erlume commission</Label>
						<Input
							id="erlumeCommission"
							type="number"
							min={0}
							step="0.01"
							value={formErlumeCommission}
							onChange={(e) => setFormErlumeCommission(e.target.value)}
							placeholder="Optional"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sellerPayout">Seller payout</Label>
						<Input
							id="sellerPayout"
							type="number"
							min={0}
							step="0.01"
							value={formSellerPayout}
							onChange={(e) => setFormSellerPayout(e.target.value)}
							placeholder="Optional"
						/>
					</div>
					<div className="space-y-2">
						<Label>Transaction</Label>
						<Select
							value={formTransactionId || "__none__"}
							onValueChange={(v) =>
								setFormTransactionId(v === "__none__" ? "" : v)
							}>
							<SelectTrigger>
								<SelectValue placeholder="None" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{safeTransactions.map((t) => (
									<SelectItem key={t._id} value={t._id}>
										{transactionLabelById.get(t._id) ?? t._id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="invoice_number">Invoice number</Label>
						<Input
							id="invoice_number"
							name="invoice_number"
							defaultValue={editingSale?.invoice_number ?? ""}
							placeholder="Optional"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="invoice_url">Invoice URL</Label>
						<Input
							id="invoice_url"
							name="invoice_url"
							defaultValue={editingSale?.invoice_url ?? ""}
							placeholder="Optional"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="payment_evidence_url">Payment evidence URL</Label>
						<Input
							id="payment_evidence_url"
							name="payment_evidence_url"
							defaultValue={editingSale?.payment_evidence_url ?? ""}
							placeholder="Optional"
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => setShowForm(false)}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingSale ? "Update" : "Create"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}
