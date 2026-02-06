import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Order, OrderItem, Sale, Transaction } from "@/types/models";
import { FileText } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function SalesPage() {
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
	const [formError, setFormError] = useState<string | null>(null);

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

	const {
		data: salesData,
		loading,
		error,
		reload,
	} = useResourceList(loadSales);
	const { data: ordersData } = useResourceList(loadOrders);
	const { data: orderItemsData } = useResourceList(loadOrderItems);
	const { data: transactionsData } = useResourceList(loadTransactions);

	const safeSales = Array.isArray(salesData) ? salesData : [];
	const safeOrders = Array.isArray(ordersData) ? ordersData : [];
	const safeOrderItems = Array.isArray(orderItemsData) ? orderItemsData : [];
	const safeTransactions = Array.isArray(transactionsData)
		? transactionsData
		: [];

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

	const orderItemsByOrder = useMemo(() => {
		const map = new Map<string, OrderItem[]>();
		safeOrderItems.forEach((oi) => {
			const list = map.get(oi.order_id) ?? [];
			list.push(oi);
			map.set(oi.order_id, list);
		});
		return map;
	}, [safeOrderItems]);

	const columns: Column<Sale>[] = [
		{
			key: "order_id",
			header: "Order",
			render: (s) => (
				<span className="text-sm">
					{orderLabelById.get(s.order_id) ?? s.order_id}
				</span>
			),
		},
		{
			key: "order_item_id",
			header: "Order item",
			render: (s) => (
				<span className="text-sm">
					{orderItemLabelById.get(s.order_item_id) ?? s.order_item_id}
				</span>
			),
		},
		{
			key: "transaction_id",
			header: "Transaction",
			render: (s) => (
				<span className="text-sm">
					{s.transaction_id
						? transactionLabelById.get(s.transaction_id) ?? s.transaction_id
						: "—"}
				</span>
			),
		},
		{
			key: "invoice_number",
			header: "Invoice",
			render: (s) => (
				<span className="text-muted-foreground">{s.invoice_number ?? "—"}</span>
			),
		},
	];

	const filteredSales = useMemo(() => {
		if (!search.trim()) return safeSales;
		const q = search.toLowerCase();
		return safeSales.filter(
			(s) =>
				(s.order_id ?? "").toLowerCase().includes(q) ||
				(s.invoice_number ?? "").toLowerCase().includes(q),
		);
	}, [safeSales, search]);

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
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
		const order_id = editingSale?.order_id ?? formOrderId;
		const order_item_id = editingSale?.order_item_id ?? formOrderItemId;
		const transaction_id = formTransactionId || undefined;
		const invoice_number = String(formData.get("invoice_number") ?? "").trim();
		const invoice_url = String(formData.get("invoice_url") ?? "").trim();
		const payment_evidence_url = String(
			formData.get("payment_evidence_url") ?? "",
		).trim();

		if (!order_id || !order_item_id) {
			setFormError("Order and order item are required.");
			return;
		}

		try {
			const payload: Partial<Sale> = {
				order_id,
				order_item_id,
				invoice_number: invoice_number || "",
				invoice_url: invoice_url || "",
				payment_evidence_url: payment_evidence_url || "",
				...(transaction_id && { transaction_id }),
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
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Failed to save sale");
			console.error("Failed to save sale", err);
		}
	};

	const availableOrderItems = formOrderId
		? orderItemsByOrder.get(formOrderId) ?? []
		: [];

	return (
		<AdminLayout>
			<PageHeader
				title="Sales"
				description="Sales records (invoice, evidence) linked to orders and order items"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search sales..."
				onAdd={() => {
					setEditingSale(null);
					setFormOrderId("");
					setFormOrderItemId("");
					setFormTransactionId("");
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
				<DataTable
					data={filteredSales}
					columns={columns}
					keyExtractor={(s) => s._id}
					onView={(s) => setSelectedSale(s)}
					onEdit={(s) => {
						setEditingSale(s);
						setFormOrderId(s.order_id);
						setFormOrderItemId(s.order_item_id);
						setFormTransactionId(s.transaction_id ?? "");
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
									{orderLabelById.get(selectedSale.order_id) ??
										selectedSale.order_id}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Order item</p>
								<p className="text-sm">
									{orderItemLabelById.get(selectedSale.order_item_id) ??
										selectedSale.order_item_id}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Transaction</p>
								<p className="text-sm">
									{selectedSale.transaction_id
										? transactionLabelById.get(selectedSale.transaction_id) ??
										  selectedSale.transaction_id
										: "—"}
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
								setFormOrderId(selectedSale.order_id);
								setFormOrderItemId(selectedSale.order_item_id);
								setFormTransactionId(selectedSale.transaction_id ?? "");
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
						<Label>Order *</Label>
						<Select
							value={(editingSale?.order_id ?? formOrderId) || "__none__"}
							onValueChange={(v) => {
								setFormOrderId(v === "__none__" ? "" : v);
								setFormOrderItemId("");
							}}
							disabled={!!editingSale}>
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
							value={
								(editingSale?.order_item_id ?? formOrderItemId) || "__none__"
							}
							onValueChange={(v) =>
								setFormOrderItemId(v === "__none__" ? "" : v)
							}
							disabled={!!editingSale}>
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
								{formOrderId &&
									availableOrderItems.length === 0 &&
									!editingSale && (
										<SelectItem value="__empty__" disabled>
											No order items for this order
										</SelectItem>
									)}
							</SelectContent>
						</Select>
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
