import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailPanel } from "@/components/common/DetailPanel";
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
import type { DiscountCode, Order, Transaction } from "@/types/models";
import { CreditCard } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";
import { FilterBar } from "@/components/common/FilterBar";

export default function TransactionsPage() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [selectedTransaction, setSelectedTransaction] =
		useState<Transaction | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [formOrderId, setFormOrderId] = useState("");
	const [formStatus, setFormStatus] = useState("completed");
	const [formPaymentMethod, setFormPaymentMethod] = useState("");
	const [formDiscountId, setFormDiscountId] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const loadTransactions = useCallback(() => {
		if (filters.orderId) {
			return restApi.transactionsExtra.getByOrderId(filters.orderId);
		}
		return restApi.transactions.getAll() as Promise<Transaction[]>;
	}, [filters.orderId]);
	const loadOrders = useCallback(
		() => restApi.orders.getAll() as Promise<Order[]>,
		[],
	);
	const loadDiscounts = useCallback(
		() => restApi.discountcodes.getAll() as Promise<DiscountCode[]>,
		[],
	);
	const loadTransactionStatus = useCallback(
		() => restApi.enums.getByCategory("transactionStatus"),
		[],
	);
	const loadPaymentMethods = useCallback(
		() => restApi.enums.getByCategory("paymentMethod"),
		[],
	);

	const {
		data: transactions,
		loading,
		error,
		reload,
	} = useResourceList(loadTransactions);
	const { data: orders } = useResourceList(loadOrders);
	const { data: discountCodes } = useResourceList(loadDiscounts);
	const { data: transactionStatus } = useResourceList(loadTransactionStatus);
	const { data: paymentMethods } = useResourceList(loadPaymentMethods);

	const safeOrders = Array.isArray(orders) ? orders : [];
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
	const discountLabelById = useMemo(
		() =>
			new Map(
				(discountCodes ?? []).map((d) => [
					d._id,
					`${d.code} (${d.discount_percentage}%)`,
				]),
			),
		[discountCodes],
	);

	const transactionStatusValues = getEnumValues(
		"transactionStatus",
		transactionStatus,
	);
	const transactionStatusOptions = getEnumOptions(
		"transactionStatus",
		transactionStatusValues,
	);
	const paymentMethodValues = getEnumValues("paymentMethod", paymentMethods);
	const paymentMethodOptions = getEnumOptions(
		"paymentMethod",
		paymentMethodValues,
	);

	const columns: Column<Transaction>[] = [
		{
			key: "order_id",
			header: "Order",
			render: (tx) => (
				<span className="text-sm">
					{orderLabelById.get(tx.order_id) ?? tx.order_id}
				</span>
			),
		},
		{
			key: "amount",
			header: "Amount",
			render: (tx) => (
				<span className="font-semibold text-success">
					${Number(tx.amount ?? 0).toFixed(2)}
				</span>
			),
		},
		{
			key: "status",
			header: "Status",
			render: (tx) => <StatusBadge status={tx.status} />,
		},
		{
			key: "paymentMethod",
			header: "Payment Method",
			render: (tx) => (
				<span className="capitalize">{tx.paymentMethod || "—"}</span>
			),
		},
		{
			key: "discount_rate",
			header: "Discount",
			render: (tx) => (
				<span className="text-muted-foreground">
					{tx.discount_rate != null ? `${tx.discount_rate}%` : "—"}
				</span>
			),
		},
	];

	const safeTransactions = Array.isArray(transactions) ? transactions : [];
	const filteredTransactions = useMemo(() => {
		if (!search.trim()) return safeTransactions;
		const q = search.toLowerCase();
		return safeTransactions.filter(
			(tx) =>
				(tx.order_id ?? "").toLowerCase().includes(q) ||
				(tx.status ?? "").toLowerCase().includes(q) ||
				(tx.paymentMethod ?? "").toLowerCase().includes(q),
		);
	}, [safeTransactions, search]);

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleDelete = async (id: string) => {
		setDeleteError(null);
		try {
			await restApi.transactions.delete(id);
			await reload();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to delete transaction";
			setDeleteError(message);
			console.error("Failed to delete transaction", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const amount = String(formData.get("amount") ?? "").trim();
		const discount_rate = String(formData.get("discount_rate") ?? "").trim();
		const order_id = editingTransaction?.order_id ?? formOrderId;

		if (!order_id && !editingTransaction) {
			setFormError("Order is required.");
			return;
		}

		try {
			const payload: Partial<Transaction> = {
				order_id,
				amount: amount || "0",
				discount_rate: discount_rate || "0",
				paymentMethod: formPaymentMethod || undefined,
				discount_id: formDiscountId || undefined,
				status: formStatus,
			};
			if (editingTransaction) {
				await restApi.transactions.update(editingTransaction._id, payload);
			} else {
				await restApi.transactions.create(
					payload as Omit<Transaction, "_id" | "createdAt" | "updatedAt">,
				);
			}
			await reload();
			setShowForm(false);
			setEditingTransaction(null);
			setFormOrderId("");
			setFormDiscountId("");
		} catch (err) {
			setFormError(
				err instanceof Error ? err.message : "Failed to save transaction",
			);
			console.error("Failed to save transaction", err);
		}
	};

	const openCreateForm = () => {
		setEditingTransaction(null);
		setFormOrderId("");
		setFormStatus("completed");
		setFormPaymentMethod("");
		setFormDiscountId("");
		setFormError(null);
		setShowForm(true);
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Transactions"
				description="Payment transactions linked to orders (often created when an order is placed)"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search transactions..."
				onAdd={openCreateForm}
				addLabel="Add transaction"
			/>

			<div className="p-6 space-y-4">
				{(loading || error || deleteError) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading..." : ""} {error ? String(error) : ""}
						{deleteError && <span className="text-destructive block mt-1">{deleteError}</span>}
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
					data={filteredTransactions}
					columns={columns}
					keyExtractor={(tx) => tx._id}
					onView={(tx) => setSelectedTransaction(tx)}
					onEdit={(tx) => {
						setEditingTransaction(tx);
						setFormOrderId(tx.order_id);
						setFormStatus(tx.status || "completed");
						setFormPaymentMethod(tx.paymentMethod || "");
						setFormDiscountId(tx.discount_id ?? "");
						setFormError(null);
						setShowForm(true);
					}}
					onDelete={(tx) => void handleDelete(tx._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedTransaction}
				onClose={() => setSelectedTransaction(null)}
				title="Transaction Details">
				{selectedTransaction && (
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div className="p-3 rounded-lg bg-muted">
								<CreditCard className="h-6 w-6 text-muted-foreground" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">Transaction</h3>
								<StatusBadge status={selectedTransaction.status} />
							</div>
						</div>
						<div className="text-center p-6 bg-muted/30 rounded-lg">
							<p className="text-sm text-muted-foreground mb-1">Amount</p>
							<p className="text-3xl font-bold text-success">
								${Number(selectedTransaction.amount ?? 0).toFixed(2)}
							</p>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between py-2 border-b border-border">
								<span className="text-muted-foreground">Order</span>
								<span className="text-sm font-medium">
									{orderLabelById.get(selectedTransaction.order_id) ??
										selectedTransaction.order_id}
								</span>
							</div>
							<div className="flex justify-between py-2 border-b border-border">
								<span className="text-muted-foreground">Payment Method</span>
								<span className="capitalize">
									{selectedTransaction.paymentMethod || "—"}
								</span>
							</div>
							<div className="flex justify-between py-2 border-b border-border">
								<span className="text-muted-foreground">Discount Rate</span>
								<span>
									{selectedTransaction.discount_rate != null
										? `${selectedTransaction.discount_rate}%`
										: "—"}
								</span>
							</div>
							<div className="flex justify-between py-2">
								<span className="text-muted-foreground">Discount Code</span>
								<span className="text-sm">
									{selectedTransaction.discount_id
										? discountLabelById.get(selectedTransaction.discount_id) ??
										  selectedTransaction.discount_id
										: "—"}
								</span>
							</div>
						</div>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingTransaction(null);
					setFormOrderId("");
					setFormPaymentMethod("");
					setFormDiscountId("");
					setFormError(null);
				}}
				title={editingTransaction ? "Edit transaction" : "Add transaction"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="space-y-2">
						<Label>Order *</Label>
						<Select
							value={
								editingTransaction
									? editingTransaction.order_id
									: formOrderId || "__placeholder__"
							}
							onValueChange={(v) =>
								setFormOrderId(v === "__placeholder__" ? "" : v)
							}
							disabled={!!editingTransaction}>
							<SelectTrigger>
								<SelectValue placeholder="Select order" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__placeholder__">Select order</SelectItem>
								{safeOrders.map((o) => (
									<SelectItem key={o._id} value={o._id}>
										{orderLabelById.get(o._id) ?? o._id}
									</SelectItem>
								))}
								{safeOrders.length === 0 && (
									<SelectItem value="__none__" disabled>
										No orders
									</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="amount">Amount *</Label>
						<Input
							id="amount"
							name="amount"
							type="number"
							step="0.01"
							min={0}
							required
							defaultValue={editingTransaction?.amount ?? ""}
							placeholder="Amount"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="discount_rate">Discount rate (%)</Label>
						<Input
							id="discount_rate"
							name="discount_rate"
							type="number"
							min={0}
							max={100}
							defaultValue={editingTransaction?.discount_rate ?? 0}
							placeholder="Percentage"
						/>
					</div>
					<div className="space-y-2">
						<Label>Discount code</Label>
						<Select
							value={formDiscountId || "__none__"}
							onValueChange={(v) =>
								setFormDiscountId(v === "__none__" ? "" : v)
							}>
							<SelectTrigger>
								<SelectValue placeholder="None" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{(discountCodes ?? []).map((d) => (
									<SelectItem key={d._id} value={d._id}>
										{discountLabelById.get(d._id) ?? d.code}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Payment method</Label>
						<Select
							value={formPaymentMethod || "__none__"}
							onValueChange={(v) =>
								setFormPaymentMethod(v === "__none__" ? "" : v)
							}>
							<SelectTrigger>
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">—</SelectItem>
								{paymentMethodOptions.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Status</Label>
						<Select
							value={
								transactionStatusOptions.some((o) => o.value === formStatus)
									? formStatus
									: transactionStatusValues[0] ?? "completed"
							}
							onValueChange={setFormStatus}>
							<SelectTrigger>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								{transactionStatusOptions.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingTransaction(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingTransaction ? "Update" : "Create"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}
