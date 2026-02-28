import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Item, Order, OrderItem, User } from "@/types/models";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Package, Calendar, User as UserIcon } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function OrdersPage() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [formStatus, setFormStatus] = useState("pending");
	const [itemSearch, setItemSearch] = useState("");
	const [showSelectedOnly, setShowSelectedOnly] = useState(false);
	const [orderItemSelections, setOrderItemSelections] = useState<
		Record<string, { selected: boolean; quantity: number; price: number }>
	>({});
	const [existingOrderItems, setExistingOrderItems] = useState<OrderItem[]>([]);
	const [orderItemsInitialized, setOrderItemsInitialized] = useState(false);
	const [formUserId, setFormUserId] = useState("");
	const [userSearch, setUserSearch] = useState("");
	const [formDeliveryDate, setFormDeliveryDate] = useState<Date | undefined>(
		undefined,
	);
	const loadOrders = useCallback(
		() => restApi.orders.getAll() as Promise<Order[]>,
		[],
	);
	const loadOrderStatus = useCallback(
		() => restApi.enums.getByCategory("orderStatus"),
		[],
	);
	const loadUsers = useCallback(
		() => restApi.users.getAll() as Promise<User[]>,
		[],
	);
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
		[],
	);
	const {
		data: orders,
		loading,
		error,
		reload,
	} = useResourceList<Order>(loadOrders);
	const { data: orderStatus } = useResourceList(loadOrderStatus);
	const { data: users } = useResourceList<User>(loadUsers);
	const { data: items } = useResourceList<Item>(loadItems);
	const userLabelById = useMemo(
		() =>
			new Map(
				users.map((user) => [
					user._id,
					user.emailAddress || user.username || user._id,
				]),
			),
		[users],
	);
	const getUserIdValue = (userId: Order["user_id"]) => {
		if (typeof userId === "string") {
			return userId;
		}
		if (userId && typeof userId === "object") {
			const candidate = userId as { _id?: string };
			return candidate._id ?? "";
		}
		return "";
	};
	const getUserLabel = (userId: Order["user_id"]) => {
		if (typeof userId === "string") {
			return userLabelById.get(userId) ?? userId;
		}
		if (userId && typeof userId === "object") {
			const candidate = userId as {
				emailAddress?: string;
				username?: string;
				_id?: string;
			};
			return (
				candidate.emailAddress ??
				candidate.username ??
				(candidate._id ? userLabelById.get(candidate._id) : undefined) ??
				candidate._id ??
				"—"
			);
		}
		return "—";
	};
	const itemLabelById = useMemo(
		() =>
			new Map(
				items.map((item) => [
					item._id,
					[item.itemName, item.brandName].filter(Boolean).join(" · ") ||
						item._id,
				]),
			),
		[items],
	);
	const existingOrderItemByItemId = useMemo(
		() =>
			new Map(
				existingOrderItems.map((orderItem) => [orderItem.item_id, orderItem]),
			),
		[existingOrderItems],
	);
	const filteredItems = useMemo(() => {
		if (!itemSearch) {
			return items;
		}
		const query = itemSearch.toLowerCase();
		return items.filter((item) => {
			const label =
				itemLabelById.get(item._id)?.toLowerCase() ?? item._id.toLowerCase();
			return (
				label.includes(query) ||
				item._id.toLowerCase().includes(query) ||
				(item.itemName ?? "").toLowerCase().includes(query) ||
				(item.brandName ?? "").toLowerCase().includes(query)
			);
		});
	}, [itemLabelById, itemSearch, items]);
	const selectedEntries = useMemo(
		() =>
			Object.entries(orderItemSelections).filter(([, value]) => value.selected),
		[orderItemSelections],
	);
	const selectedSummary = useMemo(() => {
		return selectedEntries.reduce(
			(acc, [, value]) => {
				const quantity = Number.isFinite(value.quantity) ? value.quantity : 0;
				const price = Number.isFinite(value.price) ? value.price : 0;
				return {
					count: acc.count + 1,
					quantity: acc.quantity + Math.max(0, quantity),
					total: acc.total + Math.max(0, quantity) * Math.max(0, price),
				};
			},
			{ count: 0, quantity: 0, total: 0 },
		);
	}, [selectedEntries]);
	const displayItems = useMemo(() => {
		if (!showSelectedOnly) {
			return filteredItems;
		}
		return filteredItems.filter(
			(item) => orderItemSelections[item._id]?.selected,
		);
	}, [filteredItems, orderItemSelections, showSelectedOnly]);
	const filteredUsers = useMemo(() => {
		if (!userSearch) {
			return users;
		}
		const query = userSearch.toLowerCase();
		return users.filter((user) => {
			const label =
				(userLabelById.get(user._id) || "").toLowerCase() ||
				user._id.toLowerCase();
			return (
				label.includes(query) ||
				user._id.toLowerCase().includes(query) ||
				(user.username ?? "").toLowerCase().includes(query) ||
				(user.emailAddress ?? "").toLowerCase().includes(query)
			);
		});
	}, [userLabelById, userSearch, users]);
	const orderStatusValues = getEnumValues("orderStatus", orderStatus);
	const orderStatusOptions = getEnumOptions("orderStatus", orderStatusValues);
	const normalizeStatusValue = (value: string) =>
		value.toLowerCase().replace(/\s+/g, "_").trim();
	const orderStatusForApi = (value: string): string => {
		const normalized = normalizeStatusValue(value);
		return orderStatusValues.includes(normalized)
			? normalized
			: (orderStatusValues[0] ?? "pending");
	};

	useEffect(() => {
		if (!showForm || editingOrder) {
			return;
		}
		if (Object.keys(orderItemSelections).length === 0 && items.length > 0) {
			setOrderItemSelections(
				Object.fromEntries(
					items.map((item) => [
						item._id,
						{
							selected: false,
							quantity: 1,
							price: Number(item.basePrice || 0),
						},
					]),
				),
			);
		}
	}, [editingOrder, items, orderItemSelections, showForm]);

	useEffect(() => {
		if (
			!showForm ||
			!editingOrder ||
			orderItemsInitialized ||
			items.length === 0
		) {
			return;
		}
		setOrderItemSelections(
			Object.fromEntries(
				items.map((item) => {
					const existing = existingOrderItemByItemId.get(item._id);
					return [
						item._id,
						{
							selected: Boolean(existing),
							quantity: existing?.quantity ?? 1,
							price: Number(existing?.price ?? item.basePrice ?? 0),
						},
					];
				}),
			),
		);
		setOrderItemsInitialized(true);
	}, [
		editingOrder,
		existingOrderItemByItemId,
		items,
		orderItemsInitialized,
		showForm,
	]);

	const columns: Column<Order>[] = [
		{
			key: "_id",
			header: "Order",
			render: (order) => (
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<Package className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">{order._id}</p>
						<p className="text-sm text-muted-foreground">
							{new Date(order.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "user_id",
			header: "Customer",
			render: (order) => (
				<span className="text-muted-foreground">
					{getUserLabel(order.user_id)}
				</span>
			),
		},
		{
			key: "order_status",
			header: "Status",
			render: (order) => <StatusBadge status={order.order_status} />,
		},
		{
			key: "items",
			header: "Items",
			render: (order) => (
				<span className="text-muted-foreground">
					{order.orderitem_ids?.length ?? 0}
				</span>
			),
		},
	];

	const filteredOrders = orders.filter((order) => {
		const customerLabel = getUserLabel(order.user_id);
		const matchesSearch =
			search === "" ||
			(order._id ?? "").toLowerCase().includes(search.toLowerCase()) ||
			(getUserIdValue(order.user_id) ?? "")
				.toLowerCase()
				.includes(search.toLowerCase()) ||
			(customerLabel ?? "").toLowerCase().includes(search.toLowerCase());
		const matchesStatus =
			!filters.status ||
			normalizeStatusValue(order.order_status) === filters.status;
		return matchesSearch && matchesStatus;
	});

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleDelete = async (id: string) => {
		try {
			setFormError(null);
			await restApi.orders.delete(id);
			await reload();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete order";
			setFormError(message);
			console.error("Failed to delete order", err);
		}
	};

	const loadExistingOrderItems = async (order: Order) => {
		if (!order.orderitem_ids || order.orderitem_ids.length === 0) {
			setExistingOrderItems([]);
			return;
		}
		try {
			const orderItems = (await Promise.all(
				order.orderitem_ids.map((id) => restApi.orderitems.getById(id)),
			)) as OrderItem[];
			setExistingOrderItems(orderItems);
		} catch (err) {
			console.error("Failed to load order items", err);
			setExistingOrderItems([]);
		}
	};

	const openEditOrder = (order: Order) => {
		setEditingOrder(order);
		setFormStatus(normalizeStatusValue(order.order_status));
		setFormDeliveryDate(
			order.deliveryDate ? new Date(order.deliveryDate) : undefined,
		);
		setOrderItemSelections({});
		setItemSearch("");
		setFormUserId(getUserIdValue(order.user_id));
		setUserSearch("");
		setOrderItemsInitialized(false);
		void loadExistingOrderItems(order);
		setShowForm(true);
	};

	const handleCancelOrder = async (orderId: string) => {
		try {
			setFormError(null);
			await restApi.ordersExtra.updateStatus(orderId, "cancelled");
			await reload();
			setSelectedOrder((current) =>
				current && current._id === orderId
					? { ...current, order_status: "cancelled" }
					: current,
			);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to cancel order";
			setFormError(message);
			console.error("Failed to cancel order", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const user_id = formUserId;
		if (!user_id && !editingOrder) {
			setFormError("User is required to create an order.");
			return;
		}
		const selectedItems = Object.entries(orderItemSelections)
			.filter(([, value]) => value.selected)
			.map(([itemId, value]) => ({
				item_id: itemId,
				quantity: Math.max(1, Number(value.quantity) || 1),
			}));
		const order_status = orderStatusForApi(formStatus);
		if (!editingOrder && selectedItems.length === 0) {
			setFormError("Select at least one item to create an order.");
			return;
		}

		try {
			if (editingOrder) {
				const deliveryStatus = String(
					formData.get("deliveryStatus") ?? "",
				).trim();
				const trackingReference = String(
					formData.get("trackingReference") ?? "",
				).trim();
				await restApi.ordersExtra.patch(editingOrder._id, {
					order_status,
					...(formDeliveryDate && {
						deliveryDate: formDeliveryDate.toISOString(),
					}),
					...(deliveryStatus && { deliveryStatus }),
					...(trackingReference && { trackingReference }),
				});
			} else {
				const createdOrder = await restApi.orders.create({
					user_id,
					order_status,
					orderItems: selectedItems,
				});
				const totalAmount = selectedItems.reduce(
					(sum, { item_id, quantity }) => {
						const sel = orderItemSelections[item_id];
						const qty = Math.max(1, Number(quantity) || 1);
						const price = Number(sel?.price) || 0;
						return sum + qty * price;
					},
					0,
				);
				await restApi.transactions.create({
					order_id: createdOrder._id,
					amount: String(totalAmount),
					discount_rate: "0",
					status: "pending",
				});
			}

			await reload();
			setShowForm(false);
			setEditingOrder(null);
			setFormDeliveryDate(undefined);
			setExistingOrderItems([]);
			setOrderItemsInitialized(false);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save order";
			setFormError(message);
			console.error("Failed to save order", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Orders"
				description="Track and manage customer orders"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search orders..."
				onAdd={() => {
					setEditingOrder(null);
					setFormDeliveryDate(undefined);
					setFormStatus(orderStatusValues[0] ?? "pending");
					setOrderItemSelections(
						Object.fromEntries(
							items.map((item) => [
								item._id,
								{
									selected: false,
									quantity: 1,
									price: Number(item.basePrice || 0),
								},
							]),
						),
					);
					setItemSearch("");
					setShowSelectedOnly(false);
					setFormUserId("");
					setUserSearch("");
					setExistingOrderItems([]);
					setOrderItemsInitialized(false);
					setShowForm(true);
				}}
				addLabel="Create Order"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading orders..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<FilterBar
					filters={[
						{
							key: "status",
							label: "Status",
							value: filters.status,
							options: orderStatusOptions,
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() => setFilters({})}
				/>

				<DataTable
					data={filteredOrders}
					columns={columns}
					keyExtractor={(order) => order._id}
					onView={(order) => setSelectedOrder(order)}
					onEdit={openEditOrder}
					onDelete={(order) => {
						void handleDelete(order._id);
					}}
				/>
			</div>

			{/* View Order Panel */}
			<DetailPanel
				open={!!selectedOrder}
				onClose={() => setSelectedOrder(null)}
				title="Order Details"
				description={selectedOrder?._id}>
				{selectedOrder && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold">{selectedOrder._id}</h3>
								<p className="text-sm text-muted-foreground">
									Placed on{" "}
									{new Date(selectedOrder.createdAt).toLocaleDateString()}
								</p>
							</div>
							<StatusBadge status={selectedOrder.order_status} />
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-3 text-muted-foreground">
								<UserIcon className="h-4 w-4" />
								<span>User ID</span>
								<span className="font-mono text-sm">
									{getUserIdValue(selectedOrder.user_id)}
								</span>
								<span className="text-xs text-muted-foreground">
									{getUserLabel(selectedOrder.user_id)}
								</span>
							</div>
							<div className="flex items-center gap-3 text-muted-foreground">
								<Package className="h-4 w-4" />
								<span>Items</span>
								<span className="font-mono text-sm">
									{selectedOrder.orderitem_ids?.length ?? 0}
								</span>
							</div>
							{(selectedOrder.deliveryDate ??
								selectedOrder.deliveryStatus ??
								selectedOrder.trackingReference) && (
								<div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg">
									<p className="text-sm text-muted-foreground font-medium">
										Delivery
									</p>
									{selectedOrder.deliveryStatus && (
										<p className="text-sm">
											<span className="text-muted-foreground">Status:</span>{" "}
											{selectedOrder.deliveryStatus}
										</p>
									)}
									{selectedOrder.deliveryDate && (
										<p className="text-sm">
											<span className="text-muted-foreground">Date:</span>{" "}
											{new Date(selectedOrder.deliveryDate).toLocaleString()}
										</p>
									)}
									{selectedOrder.trackingReference && (
										<p className="text-sm">
											<span className="text-muted-foreground">Tracking:</span>{" "}
											{selectedOrder.trackingReference}
										</p>
									)}
								</div>
							)}
							<div className="flex items-center gap-3 text-muted-foreground">
								<Calendar className="h-4 w-4" />
								<span>Updated</span>
								<span>
									{new Date(selectedOrder.updatedAt).toLocaleString()}
								</span>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => openEditOrder(selectedOrder)}>
								Update order / delivery
							</Button>
							<Button
								variant="destructive"
								className="flex-1"
								onClick={() => void handleCancelOrder(selectedOrder._id)}>
								Cancel Order
							</Button>
						</div>
					</div>
				)}
			</DetailPanel>

			{/* Create/Edit Order Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingOrder(null);
					setFormDeliveryDate(undefined);
					setOrderItemSelections({});
					setItemSearch("");
					setShowSelectedOnly(false);
					setFormUserId("");
					setUserSearch("");
					setExistingOrderItems([]);
					setOrderItemsInitialized(false);
				}}
				title={editingOrder ? "Update Order Status" : "Create Order"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					{!editingOrder && (
						<div className="space-y-2">
							<Label>User</Label>
							<Input
								value={userSearch}
								onChange={(event) => setUserSearch(event.target.value)}
								placeholder="Search users..."
							/>
							<Select
								value={formUserId}
								onValueChange={(value) => setFormUserId(value)}>
								<SelectTrigger>
									<SelectValue placeholder="Select user" />
								</SelectTrigger>
								<SelectContent>
									{filteredUsers.length === 0 && (
										<SelectItem value="__none__" disabled>
											No users found
										</SelectItem>
									)}
									{filteredUsers.map((user) => (
										<SelectItem key={user._id} value={user._id}>
											{userLabelById.get(user._id)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					{!editingOrder && (
						<div className="space-y-2">
							<Label>Items</Label>
							<Input
								value={itemSearch}
								onChange={(event) => setItemSearch(event.target.value)}
								placeholder="Search items..."
							/>
							<div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
								<span>
									Selected {selectedSummary.count} · Qty{" "}
									{selectedSummary.quantity}
									{" · "}Total {selectedSummary.total.toFixed(2)}
								</span>
								<div className="flex items-center gap-2">
									<label className="flex items-center gap-2">
										<Checkbox
											checked={showSelectedOnly}
											onCheckedChange={(checked) =>
												setShowSelectedOnly(Boolean(checked))
											}
										/>
										<span>Show selected</span>
									</label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setOrderItemSelections((prev) => {
												const next = { ...prev };
												filteredItems.forEach((item) => {
													const current = next[item._id] ?? {
														selected: false,
														quantity: 1,
														price: Number(item.basePrice || 0),
													};
													next[item._id] = { ...current, selected: true };
												});
												return next;
											});
										}}>
										Select all filtered
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => {
											setOrderItemSelections((prev) =>
												Object.fromEntries(
													Object.entries(prev).map(([id, value]) => [
														id,
														{ ...value, selected: false },
													]),
												),
											);
										}}>
										Clear all
									</Button>
								</div>
							</div>
							<div className="border border-input rounded-md p-3 max-h-64 overflow-y-auto space-y-2 bg-background">
								{displayItems.length === 0 && (
									<p className="text-sm text-muted-foreground">No items found.</p>
								)}
								{displayItems.map((item) => {
									const selection = orderItemSelections[item._id] ?? {
										selected: false,
										quantity: 1,
										price: Number(item.basePrice || 0),
									};
									return (
										<label
											key={item._id}
											className="grid grid-cols-1 sm:grid-cols-[auto,1fr,auto,auto] items-start sm:items-center gap-3 text-sm text-foreground">
											<Checkbox
												checked={selection.selected}
												onCheckedChange={(checked) => {
													setOrderItemSelections((prev) => ({
														...prev,
														[item._id]: {
															...selection,
															selected: Boolean(checked),
														},
													}));
												}}
											/>
											<span className="flex-1 truncate">
												{itemLabelById.get(item._id)}
											</span>
											<Input
												type="number"
												className="w-24 sm:w-20"
												min={1}
												disabled={!selection.selected}
												value={selection.quantity}
												onChange={(event) => {
													const quantity = Math.max(
														1,
														Number(event.target.value || 1),
													);
													setOrderItemSelections((prev) => ({
														...prev,
														[item._id]: {
															...selection,
															quantity,
														},
													}));
												}}
											/>
											<Input
												type="number"
												className="w-32 sm:w-28"
												min={0}
												disabled={!selection.selected}
												value={selection.price}
												onChange={(event) => {
													const price = Math.max(
														0,
														Number(event.target.value || 0),
													);
													setOrderItemSelections((prev) => ({
														...prev,
														[item._id]: {
															...selection,
															price,
														},
													}));
												}}
											/>
										</label>
									);
								})}
							</div>
							<div className="hidden sm:grid grid-cols-[auto,1fr,auto,auto] gap-3 text-xs text-muted-foreground">
								<span className="w-5" />
								<span className="flex-1">Item</span>
								<span className="w-20">Qty</span>
								<span className="w-28">Price</span>
							</div>
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="order_status">Status</Label>
						<Select
							value={formStatus}
							onValueChange={(value) => setFormStatus(value)}>
							<SelectTrigger>
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								{orderStatusOptions.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{editingOrder && (
						<>
							<div className="space-y-2">
								<Label>Delivery date</Label>
								<DateTimePicker
									value={formDeliveryDate}
									onChange={setFormDeliveryDate}
									placeholder="Select date and time"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="deliveryStatus">Delivery status</Label>
								<Select
									defaultValue={editingOrder.deliveryStatus ?? ""}
									onValueChange={(v) => {
										const el = document.querySelector<HTMLInputElement>(
											'input[name="deliveryStatus"]',
										);
										if (el) el.value = v;
									}}>
									<SelectTrigger>
										<SelectValue placeholder="—" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">—</SelectItem>
										<SelectItem value="pending">Pending</SelectItem>
										<SelectItem value="shipped">Shipped</SelectItem>
										<SelectItem value="delivered">Delivered</SelectItem>
										<SelectItem value="failed">Failed</SelectItem>
									</SelectContent>
								</Select>
								<input
									type="hidden"
									name="deliveryStatus"
									defaultValue={editingOrder.deliveryStatus ?? ""}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="trackingReference">Tracking reference</Label>
								<Input
									id="trackingReference"
									name="trackingReference"
									defaultValue={editingOrder.trackingReference ?? ""}
									placeholder="Tracking number"
								/>
							</div>
						</>
					)}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingOrder(null);
								setFormDeliveryDate(undefined);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingOrder ? "Update" : "Create"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}
