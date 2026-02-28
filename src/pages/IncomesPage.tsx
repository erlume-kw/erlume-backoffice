import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Income, Item, Order, Seller, User } from "@/types/models";
import { DollarSign } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function IncomesPage() {
	const getRefId = (value: unknown): string => {
		if (typeof value === "string") return value;
		if (value && typeof value === "object") {
			const record = value as Record<string, unknown>;
			if (typeof record._id === "string") return record._id;
		}
		return "";
	};
	const getItemDisplay = (value: unknown): string => {
		if (typeof value === "string") return value;
		if (value && typeof value === "object") {
			const record = value as Record<string, unknown>;
			const itemName =
				typeof record.itemName === "string" ? record.itemName : "";
			const brandName =
				typeof record.brandName === "string" ? record.brandName : "";
			const combined = [itemName, brandName].filter(Boolean).join(" · ");
			if (combined) return combined;
			if (typeof record._id === "string") return record._id;
		}
		return "";
	};
	const [search, setSearch] = useState("");
	const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingIncome, setEditingIncome] = useState<Income | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [formOrderId, setFormOrderId] = useState("");
	const [formItemId, setFormItemId] = useState("");
	const [formSellerId, setFormSellerId] = useState("");
	const [formReceivedAt, setFormReceivedAt] = useState<Date | undefined>(
		undefined,
	);
	const [formMonth, setFormMonth] = useState("");
	const [formPrelaunchBag, setFormPrelaunchBag] = useState("");

	const loadOrders = useCallback(
		() => restApi.orders.getAll() as Promise<Order[]>,
		[],
	);
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
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

	const loadIncomes = useCallback(
		() =>
			restApi.incomes.getAll({
				...(filters.orderId && { orderId: filters.orderId }),
				...(filters.itemId && { itemId: filters.itemId }),
				...(filters.sellerId && { sellerId: filters.sellerId }),
				...(filters.year && { year: Number(filters.year) }),
				...(filters.month && { month: Number(filters.month) }),
			}) as Promise<Income[]>,
		[
			filters.orderId,
			filters.itemId,
			filters.sellerId,
			filters.year,
			filters.month,
		],
	);
	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const {
		data: incomes,
		loading,
		error,
		reload,
	} = useResourceList(loadIncomes);
	const { data: orders } = useResourceList(loadOrders);
	const { data: items } = useResourceList(loadItems);
	const { data: sellers } = useResourceList(loadSellers);
	const { data: users } = useResourceList(loadUsers);

	const safeOrders = Array.isArray(orders) ? orders : [];
	const safeItems = Array.isArray(items) ? items : [];
	const safeSellers = Array.isArray(sellers) ? sellers : [];
	const safeUsers = Array.isArray(users) ? users : [];
	const safeIncomes = Array.isArray(incomes) ? incomes : [];
	const userLabelById = useMemo(
		() =>
			new Map(
				safeUsers.map((user) => [
					user._id,
					user.emailAddress || user.username || user._id,
				]),
			),
		[safeUsers],
	);
	const getSellerUserId = (seller: Seller): string => {
		const uid = seller.userId as unknown;
		if (typeof uid === "string") return uid;
		if (uid && typeof uid === "object" && "_id" in (uid as Record<string, unknown>)) {
			const candidate = uid as { _id?: string };
			return candidate._id ?? seller._id;
		}
		return seller._id;
	};
	const toSellerUserId = (id: string): string => {
		if (!id) return "";
		const match = safeSellers.find((seller) => seller._id === id);
		if (!match) return id;
		return getSellerUserId(match);
	};
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
	const sellerLabelById = useMemo(
		() => {
			const map = new Map<string, string>();
			for (const seller of safeSellers) {
				const sellerUserId = getSellerUserId(seller);
				const label = userLabelById.get(sellerUserId) ?? sellerUserId ?? seller._id;
				map.set(seller._id, label);
				map.set(sellerUserId, label);
			}
			return map;
		},
		[safeSellers, userLabelById],
	);

	const columns: Column<Income>[] = [
		{
			key: "amount",
			header: "Amount",
			render: (inc) => (
				<span className="font-semibold text-foreground">
					KD {Number(inc.amount ?? 0).toFixed(2)}
				</span>
			),
		},
		{
			key: "order_id",
			header: "Order",
			render: (inc) => (
				<span className="text-sm truncate max-w-[140px] block">
					{(() => {
						const orderId = getRefId(inc.order_id);
						return orderId
							? (orderLabelById.get(orderId) ?? orderId)
							: "—";
					})()}
				</span>
			),
		},
		{
			key: "item_id",
			header: "Item",
			render: (inc) => (
				<span className="text-sm truncate max-w-[140px] block">
					{(() => {
						const itemId = getRefId(inc.item_id);
						if (itemId) return itemLabelById.get(itemId) ?? itemId;
						const display = getItemDisplay(inc.item_id);
						return display || "—";
					})()}
				</span>
			),
		},
		{
			key: "seller_id",
			header: "Seller",
			render: (inc) => (
				<span className="text-sm truncate max-w-[120px] block">
					{(() => {
						const sellerId = getRefId(inc.seller_id);
						return sellerId
							? (sellerLabelById.get(sellerId) ?? sellerId)
							: "—";
					})()}
				</span>
			),
		},
		{
			key: "received_at",
			header: "Received",
			render: (inc) => (
				<span className="text-muted-foreground text-sm">
					{inc.received_at
						? new Date(inc.received_at).toLocaleDateString()
						: "—"}
				</span>
			),
		},
	];

	const filteredIncomes = useMemo(() => {
		if (!search.trim()) return safeIncomes;
		const q = search.toLowerCase();
		return safeIncomes.filter(
			(inc) =>
				getRefId(inc.order_id).toLowerCase().includes(q) ||
				(getItemDisplay(inc.item_id).toLowerCase().includes(q) ||
					getRefId(inc.item_id).toLowerCase().includes(q)) ||
				getRefId(inc.seller_id).toLowerCase().includes(q) ||
				(inc.prelaunch_bag ?? "").toLowerCase().includes(q) ||
				String(inc.amount ?? "").includes(q) ||
				(inc.notes ?? "").toLowerCase().includes(q),
		);
	}, [safeIncomes, search]);

	const handleDelete = async (id: string) => {
		try {
			await restApi.incomes.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete income", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const amount = String(formData.get("amount") ?? "").trim();
		const order_id = formOrderId || undefined;
		const item_id = formItemId || undefined;
		const seller_id = formSellerId ? toSellerUserId(formSellerId) : undefined;
		const notes = String(formData.get("notes") ?? "").trim();
		const month =
			formMonth.trim() !== ""
				? new Date(`${formMonth}-01`).toISOString()
				: undefined;
		const received_at = formReceivedAt
			? formReceivedAt.toISOString()
			: new Date().toISOString();

		if (!amount) {
			setFormError("Amount is required.");
			return;
		}

		const payload: Partial<Income> = {
			amount,
			currency: "KWD",
			platform: "backoffice",
			income_type: "sale",
			received_at,
			...(order_id && { order_id }),
			...(item_id && { item_id }),
			...(seller_id && { seller_id }),
			...(formPrelaunchBag.trim() && { prelaunch_bag: formPrelaunchBag.trim() }),
			...(month && { month }),
			...(notes && { notes }),
		};

		try {
			const editId = editingIncome?._id?.trim();
			if (editingIncome && !editId) {
				setFormError("Cannot update income: missing income id.");
				return;
			}
			if (editId) {
				await restApi.incomesExtra.update(
					editId,
					payload as Record<string, unknown>,
				);
			} else {
				await restApi.incomesExtra.create(
					payload as Record<string, unknown>,
				);
			}
			await reload();
			setShowForm(false);
			setEditingIncome(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save income";
			const mode = editingIncome ? "update" : "create";
			const idInfo = editingIncome?._id ? ` (id: ${editingIncome._id})` : "";
			setFormError(message);
			console.error(`Failed to ${mode} income${idInfo}`, err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Incomes"
				description="Erlume bank receipts only (amount = money received by Erlume)"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search by order, item, seller, amount..."
				onAdd={() => {
					setEditingIncome(null);
					setFormOrderId("");
					setFormItemId("");
					setFormSellerId("");
					setFormReceivedAt(undefined);
					setFormMonth("");
					setFormPrelaunchBag("");
					setShowForm(true);
					setFormError(null);
				}}
				addLabel="Add income"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading incomes..." : ""}
						{error ? (
							<span>
								{" "}
								{String(error).includes("Cannot GET") ||
								String(error).includes("404")
									? "Incomes API not available. Ensure the backend implements GET /api/incomes (see openapi.json)."
									: error}
							</span>
						) : null}
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
						{
							key: "itemId",
							label: "Item",
							value: filters.itemId,
							options: [
								{ value: "", label: "All items" },
								...safeItems.map((i) => ({
									value: i._id,
									label: itemLabelById.get(i._id) ?? i._id,
								})),
							],
						},
						{
							key: "sellerId",
							label: "Seller",
							value: filters.sellerId,
							options: [
								{ value: "", label: "All sellers" },
								...safeSellers.map((s) => ({
									value: getSellerUserId(s),
									label: sellerLabelById.get(s._id) ?? s._id,
								})),
							],
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() => setFilters({})}
				/>
				<DataTable
					data={filteredIncomes}
					columns={columns}
					keyExtractor={(inc) => inc._id}
					onView={(inc) => setSelectedIncome(inc)}
					onEdit={(inc) => {
						setEditingIncome(inc);
						setFormOrderId(getRefId(inc.order_id));
						setFormItemId(getRefId(inc.item_id));
						setFormSellerId(getRefId(inc.seller_id));
						setFormMonth(
							inc.month ? new Date(inc.month).toISOString().slice(0, 7) : "",
						);
						setFormPrelaunchBag(inc.prelaunch_bag ?? "");
						setFormReceivedAt(
							inc.received_at ? new Date(inc.received_at) : undefined,
						);
						setShowForm(true);
						setFormError(null);
					}}
					onDelete={(inc) => void handleDelete(inc._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedIncome}
				onClose={() => setSelectedIncome(null)}
				title="Income details"
				description={selectedIncome?._id}>
				{selectedIncome && (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
								<DollarSign className="h-6 w-6 text-primary" />
							</div>
							<div>
								<p className="text-lg font-semibold">
									KD {Number(selectedIncome.amount ?? 0).toFixed(2)}
								</p>
								<p className="text-sm text-muted-foreground">
									Money received by Erlume
								</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Order</p>
								<p className="text-sm truncate">
									{selectedIncome.order_id
										? (() => {
												const orderId = getRefId(selectedIncome.order_id);
												return orderId
													? (orderLabelById.get(orderId) ?? orderId)
													: "—";
											})()
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Item</p>
								<p className="text-sm truncate">
									{selectedIncome.item_id
										? (() => {
												const itemId = getRefId(selectedIncome.item_id);
												if (itemId) return itemLabelById.get(itemId) ?? itemId;
												return getItemDisplay(selectedIncome.item_id) || "—";
											})()
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Prelaunch bag</p>
								<p className="text-sm">
									{selectedIncome.prelaunch_bag || "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Month</p>
								<p className="text-sm">
									{selectedIncome.month
										? new Date(selectedIncome.month).toLocaleDateString("en-US", {
												month: "short",
												year: "numeric",
											})
										: "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Seller</p>
								<p className="text-sm truncate">
									{selectedIncome.seller_id
										? (() => {
												const sellerId = getRefId(selectedIncome.seller_id);
												return sellerId
													? (sellerLabelById.get(sellerId) ?? sellerId)
													: "—";
											})()
										: "—"}
								</p>
							</div>
							{selectedIncome.notes && (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-xs text-muted-foreground">Notes</p>
									<p className="text-sm">{selectedIncome.notes}</p>
								</div>
							)}
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Received at</p>
								<p className="text-sm">
									{selectedIncome.received_at
										? new Date(selectedIncome.received_at).toLocaleString()
										: "—"}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingIncome(selectedIncome);
								setFormOrderId(getRefId(selectedIncome.order_id));
								setFormItemId(getRefId(selectedIncome.item_id));
								setFormSellerId(getRefId(selectedIncome.seller_id));
								setFormMonth(
									selectedIncome.month
										? new Date(selectedIncome.month).toISOString().slice(0, 7)
										: "",
								);
								setFormPrelaunchBag(selectedIncome.prelaunch_bag ?? "");
								setFormReceivedAt(
									selectedIncome.received_at
										? new Date(selectedIncome.received_at)
										: undefined,
								);
								setSelectedIncome(null);
								setShowForm(true);
							}}>
							Edit income
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingIncome(null);
					setFormReceivedAt(undefined);
					setFormMonth("");
					setFormPrelaunchBag("");
					setFormError(null);
				}}
				title={editingIncome ? "Edit income" : "Add income"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="amount">Amount *</Label>
						<Input
							id="amount"
							name="amount"
							type="text"
							inputMode="decimal"
							defaultValue={editingIncome?.amount ?? ""}
							placeholder="Amount"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>Order</Label>
						<Select
							value={formOrderId || "__none__"}
							onValueChange={(v) => setFormOrderId(v === "__none__" ? "" : v)}>
							<SelectTrigger>
								<SelectValue placeholder="Select order" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{safeOrders.map((o) => (
									<SelectItem key={o._id} value={o._id}>
										{orderLabelById.get(o._id) ?? o._id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Item</Label>
						<Select
							value={formItemId || "__none__"}
							onValueChange={(v) => setFormItemId(v === "__none__" ? "" : v)}>
							<SelectTrigger>
								<SelectValue placeholder="Select item" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{safeItems.map((i) => (
									<SelectItem key={i._id} value={i._id}>
										{itemLabelById.get(i._id) ?? i._id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Seller</Label>
						<Select
							value={formSellerId || "__none__"}
							onValueChange={(v) => setFormSellerId(v === "__none__" ? "" : v)}>
							<SelectTrigger>
								<SelectValue placeholder="Select seller" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{safeSellers.map((s) => (
									<SelectItem key={s._id} value={getSellerUserId(s)}>
										{sellerLabelById.get(s._id) ?? s._id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="prelaunch_bag">Prelaunch bag</Label>
						<Input
							id="prelaunch_bag"
							name="prelaunch_bag"
							value={formPrelaunchBag}
							onChange={(e) => setFormPrelaunchBag(e.target.value)}
							placeholder="Name-Brand-Year"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="month">Month</Label>
						<Input
							id="month"
							name="month"
							type="month"
							value={formMonth}
							onChange={(e) => setFormMonth(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Received at</Label>
						<DateTimePicker
							value={formReceivedAt ?? new Date()}
							onChange={(d) => setFormReceivedAt(d ?? new Date())}
							placeholder="Select date and time"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="notes">Notes</Label>
						<Input
							id="notes"
							name="notes"
							defaultValue={editingIncome?.notes ?? ""}
							placeholder="Optional notes"
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingIncome(null);
								setFormReceivedAt(undefined);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingIncome ? "Save" : "Add"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}
