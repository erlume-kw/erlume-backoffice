import { useCallback, useMemo } from "react";
import { ShoppingCart, Users, Package, TrendingUp, Store } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";
import type {
	Category,
	Item,
	Order,
	Sale,
	Seller,
	Transaction,
	User,
} from "@/types/models";

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const percentChange = (current: number, previous: number) => {
	if (previous <= 0) {
		return 0;
	}
	return ((current - previous) / previous) * 100;
};

const getRefId = (value: unknown): string => {
	if (typeof value === "string") return value;
	if (value && typeof value === "object") {
		const record = value as { _id?: string };
		return record._id ?? "";
	}
	return "";
};

const isDeliveredSaleByStatus = (sale: Sale) =>
	(sale.status ?? "").trim().toLowerCase() === "delivered";

const getSaleCommission = (sale: Sale) => {
	const candidate = sale as Sale & {
		erlumeCommissionAmount?: string;
		erlume_commission?: string;
	};
	const raw =
		sale.erlumeCommission ??
		candidate.erlumeCommissionAmount ??
		candidate.erlume_commission ??
		"0";
	const commission = Number(raw);
	return Number.isFinite(commission) && commission >= 0 ? commission : 0;
};

const getSaleSellerPayout = (sale: Sale) => {
	const candidate = sale as Sale & {
		sellerPayoutAmount?: string;
		seller_payout?: string;
	};
	const raw =
		sale.sellerPayout ??
		candidate.sellerPayoutAmount ??
		candidate.seller_payout ??
		"";
	const payout = Number(raw);
	if (Number.isFinite(payout) && payout >= 0) {
		return payout;
	}
	const amount = Number(sale.amount ?? 0);
	const commission = getSaleCommission(sale);
	if (Number.isFinite(amount) && amount >= 0 && commission >= 0) {
		return Math.max(0, amount - commission);
	}
	return 0;
};

const getSaleDate = (sale: Sale) =>
	sale.sale_date ? new Date(sale.sale_date) : new Date(sale.createdAt);

export default function DashboardPage() {
	const loadUsers = useCallback(
		() => restApi.users.getAll() as Promise<User[]>,
		[],
	);
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
		[],
	);
	const loadOrders = useCallback(
		() => restApi.orders.getAll() as Promise<Order[]>,
		[],
	);
	const loadSellers = useCallback(
		() => restApi.sellers.getAll() as Promise<Seller[]>,
		[],
	);
	const loadCategories = useCallback(
		() => restApi.categories.getAll() as Promise<Category[]>,
		[],
	);
	const loadTransactions = useCallback(
		() => restApi.transactions.getAll() as Promise<Transaction[]>,
		[],
	);
	const loadSales = useCallback(
		() => restApi.sales.getAll() as Promise<Sale[]>,
		[],
	);

	const {
		data: users,
		loading: usersLoading,
		error: usersError,
	} = useResourceList(loadUsers);
	const {
		data: items,
		loading: itemsLoading,
		error: itemsError,
	} = useResourceList(loadItems);
	const {
		data: orders,
		loading: ordersLoading,
		error: ordersError,
	} = useResourceList(loadOrders);
	const {
		data: sellers,
		loading: sellersLoading,
		error: sellersError,
	} = useResourceList(loadSellers);
	const {
		data: categories,
		loading: categoriesLoading,
		error: categoriesError,
	} = useResourceList(loadCategories);
	const {
		data: transactions,
		loading: transactionsLoading,
		error: transactionsError,
	} = useResourceList(loadTransactions);
	const {
		data: sales,
		loading: salesLoading,
		error: salesError,
	} = useResourceList(loadSales);

	const loading =
		usersLoading ||
		itemsLoading ||
		ordersLoading ||
		sellersLoading ||
		categoriesLoading ||
		transactionsLoading ||
		salesLoading;
	const error =
		usersError ||
		itemsError ||
		ordersError ||
		sellersError ||
		categoriesError ||
		transactionsError ||
		salesError;

	const dashboardKpis = useMemo(() => {
		const deliveredOrderIds = new Set(
			orders
				.filter((order) => order.order_status?.toLowerCase() === "delivered")
				.map((order) => order._id),
		);
		const deliveredSales = sales.filter((sale) => {
			const orderId = getRefId(sale.order_id);
			return (
				isDeliveredSaleByStatus(sale) ||
				(orderId ? deliveredOrderIds.has(orderId) : false)
			);
		});
		const totalRevenue = deliveredSales.reduce(
			(sum, sale) => sum + getSaleCommission(sale),
			0,
		);
		const totalOrders = orders.length;
		const totalUsers = users.length;
		const totalItems = items.length;

		const now = new Date();
		const sevenDaysAgo = new Date(now);
		sevenDaysAgo.setDate(now.getDate() - 7);
		const fourteenDaysAgo = new Date(now);
		fourteenDaysAgo.setDate(now.getDate() - 14);

		const currentOrders = orders.filter(
			(order) => new Date(order.createdAt) >= sevenDaysAgo,
		).length;
		const previousOrders = orders.filter((order) => {
			const created = new Date(order.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		const currentUsers = users.filter(
			(user) => new Date(user.createdAt) >= sevenDaysAgo,
		).length;
		const previousUsers = users.filter((user) => {
			const created = new Date(user.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		const currentItems = items.filter(
			(item) => new Date(item.createdAt) >= sevenDaysAgo,
		).length;
		const previousItems = items.filter((item) => {
			const created = new Date(item.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		const currentRevenue = deliveredSales
			.filter((sale) => getSaleDate(sale) >= sevenDaysAgo)
			.reduce((sum, sale) => sum + getSaleCommission(sale), 0);
		const previousRevenue = deliveredSales
			.filter((sale) => {
				if (!sale.createdAt && !sale.sale_date) {
					return false;
				}
				const saleDate = getSaleDate(sale);
				return saleDate >= fourteenDaysAgo && saleDate < sevenDaysAgo;
			})
			.reduce((sum, sale) => sum + getSaleCommission(sale), 0);

		const totalSellers = sellers.length;
		const currentSellers = sellers.filter(
			(s) => new Date(s.createdAt) >= sevenDaysAgo,
		).length;
		const previousSellers = sellers.filter((s) => {
			const created = new Date(s.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		return {
			totalRevenue,
			revenueChange: percentChange(currentRevenue, previousRevenue),
			totalOrders,
			ordersChange: percentChange(currentOrders, previousOrders),
			totalUsers,
			usersChange: percentChange(currentUsers, previousUsers),
			totalItems,
			itemsChange: percentChange(currentItems, previousItems),
			totalSellers,
			sellersChange: percentChange(currentSellers, previousSellers),
		};
	}, [items, orders, sales, sellers, users]);

	const revenueData = useMemo(() => {
		const now = new Date();
		const days = Array.from({ length: 14 }, (_, index) => {
			const date = new Date(now);
			date.setDate(now.getDate() - (13 - index));
			return date;
		});

		const deliveredOrderIds = new Set(
			orders
				.filter((order) => order.order_status?.toLowerCase() === "delivered")
				.map((order) => order._id),
		);
		const totals = new Map<string, { revenue: number; orders: number }>();
		orders.forEach((order) => {
			const key = toDateKey(new Date(order.createdAt));
			const current = totals.get(key) ?? { revenue: 0, orders: 0 };
			current.orders += 1;
			totals.set(key, current);
		});
		sales.forEach((sale) => {
			const orderId = getRefId(sale.order_id);
			const isDelivered =
				isDeliveredSaleByStatus(sale) ||
				(orderId ? deliveredOrderIds.has(orderId) : false);
			if (!isDelivered || (!sale.createdAt && !sale.sale_date)) {
				return;
			}
			const key = toDateKey(getSaleDate(sale));
			const current = totals.get(key) ?? { revenue: 0, orders: 0 };
			current.revenue += getSaleCommission(sale);
			totals.set(key, current);
		});

		return days.map((date) => {
			const key = toDateKey(date);
			const totalsForDay = totals.get(key) ?? { revenue: 0, orders: 0 };
			return {
				date: date.toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
				}),
				revenue: totalsForDay.revenue,
				orders: totalsForDay.orders,
			};
		});
	}, [orders, sales]);

	const categoryData = useMemo(() => {
		const categoriesById = new Map(
			categories.map((category) => [category._id, category.name]),
		);
		const totals = new Map<
			string,
			{ name: string; count: number; revenue: number }
		>();

		items.forEach((item) => {
			const name =
				categoriesById.get(item.category_id) ||
				item.category_id ||
				"Uncategorized";
			const current = totals.get(item.category_id) ?? {
				name,
				count: 0,
				revenue: 0,
			};
			current.count += 1;
			current.revenue += Number(item.basePrice ?? 0) || 0;
			totals.set(item.category_id, current);
		});

		return Array.from(totals.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	}, [categories, items]);

	const orderStatusData = useMemo(() => {
		const statusColors: Record<string, string> = {
			pending: "hsl(var(--warning))",
			processing: "hsl(var(--chart-4))",
			shipped: "hsl(var(--primary))",
			delivered: "hsl(var(--success))",
			cancelled: "hsl(var(--destructive))",
			confirmed: "hsl(var(--chart-3))",
			refunded: "hsl(var(--chart-5))",
		};

		const counts = new Map<string, number>();
		orders.forEach((order) => {
			counts.set(order.order_status, (counts.get(order.order_status) ?? 0) + 1);
		});

		return Array.from(counts.entries()).map(([status, count]) => ({
			status: status.charAt(0).toUpperCase() + status.slice(1),
			count,
			color: statusColors[status] || "hsl(var(--muted-foreground))",
		}));
	}, [orders]);

	const recentOrders = useMemo(() => {
		const usersById = new Map(users.map((user) => [user._id, user]));
		const totalsByOrder = new Map<string, number>();
		transactions.forEach((tx) => {
			const amount = Number(tx.amount ?? 0) || 0;
			const orderId = getRefId(tx.order_id);
			if (!orderId) return;
			totalsByOrder.set(orderId, (totalsByOrder.get(orderId) ?? 0) + amount);
		});
		return [...orders]
			.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
			.slice(0, 5)
			.map((order) => {
				const userRef = order.user_id as unknown;
				const userId =
					typeof userRef === "string"
						? userRef
						: typeof userRef === "object" && userRef !== null
							? ((userRef as { _id?: string })._id ?? "")
							: "";
				const user = usersById.get(userId);
				const customer =
					user?.emailAddress ??
					user?.phoneNumber ??
					(typeof userRef === "string"
						? userRef
						: typeof userRef === "object" && userRef !== null
							? ((
									userRef as {
										emailAddress?: string;
										phoneNumber?: string;
										_id?: string;
									}
								).emailAddress ??
								(userRef as { phoneNumber?: string; _id?: string })
									.phoneNumber ??
								(userRef as { _id?: string })._id ??
								"—")
							: "—");
				return {
					id: order._id,
					customer,
					total: totalsByOrder.get(order._id) ?? 0,
					status: order.order_status,
				};
			});
	}, [orders, transactions, users]);

	const topSellers = useMemo(() => {
		const usersById = new Map(users.map((user) => [user._id, user]));
		const sellerUserIdBySellerDocId = new Map(
			sellers.map((seller) => [seller._id, getRefId(seller.userId)]),
		);
		const sellerStatsByUserId = new Map<
			string,
			{ sales: number; revenue: number }
		>();
		const deliveredOrderIds = new Set(
			orders
				.filter((order) => order.order_status?.toLowerCase() === "delivered")
				.map((order) => order._id),
		);
		const itemById = new Map(items.map((item) => [item._id, item]));

		sales.forEach((sale) => {
			const orderId = getRefId(sale.order_id);
			const isDelivered =
				isDeliveredSaleByStatus(sale) ||
				(orderId ? deliveredOrderIds.has(orderId) : false);
			if (!isDelivered) return;

			const itemId = getRefId(sale.item_id);
			if (!itemId) return;
			const item = itemById.get(itemId);
			if (!item) return;

			const sellerRef =
				(item as Item & { sellerId?: string }).sellerId ?? item.seller_id ?? "";
			const sellerRefId = getRefId(sellerRef);
			if (!sellerRefId) return;
			const sellerUserId =
				sellerUserIdBySellerDocId.get(sellerRefId) ?? sellerRefId;

			const current = sellerStatsByUserId.get(sellerUserId) ?? {
				sales: 0,
				revenue: 0,
			};
			current.sales += 1;
			current.revenue += getSaleSellerPayout(sale);
			sellerStatsByUserId.set(sellerUserId, current);
		});

		return Array.from(sellerStatsByUserId.entries())
			.map(([sellerUserId, stats]) => ({
				name:
					usersById.get(sellerUserId)?.emailAddress ??
					usersById.get(sellerUserId)?.phoneNumber ??
					sellerUserId,
				sales: stats.sales,
				revenue: stats.revenue,
			}))
			.sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
			.slice(0, 5);
	}, [items, orders, sales, sellers, users]);

	return (
		<AdminLayout>
			<PageHeader
				title="Dashboard"
				description="Overview of your marketplace performance"
			/>

			<div className="p-6 space-y-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading dashboard data..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				{/* KPI Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
					<KpiCard
						title="Total Revenue"
						value={dashboardKpis.totalRevenue}
						change={dashboardKpis.revenueChange}
						trend="up"
						format="currency"
						icon={
							<span className="text-lg font-semibold text-primary">KD</span>
						}
					/>
					<KpiCard
						title="Total Orders"
						value={dashboardKpis.totalOrders}
						change={dashboardKpis.ordersChange}
						trend="up"
						icon={<ShoppingCart className="h-5 w-5" />}
					/>
					<KpiCard
						title="Total Users"
						value={dashboardKpis.totalUsers}
						change={dashboardKpis.usersChange}
						trend="up"
						icon={<Users className="h-5 w-5" />}
					/>
					<KpiCard
						title="Active Items"
						value={dashboardKpis.totalItems}
						change={dashboardKpis.itemsChange}
						trend="down"
						icon={<Package className="h-5 w-5" />}
					/>
					<KpiCard
						title="Total Sellers"
						value={dashboardKpis.totalSellers}
						change={dashboardKpis.sellersChange}
						trend="up"
						icon={<Store className="h-5 w-5" />}
					/>
				</div>

				{/* Charts Row */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Revenue Chart */}
					<div className="lg:col-span-2 glass-card p-6">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h3 className="text-lg font-semibold text-foreground">
									Revenue Overview
								</h3>
								<p className="text-sm text-muted-foreground">
									Daily revenue for the last 14 days
								</p>
							</div>
							<div className="flex items-center gap-2 text-success text-sm">
								<TrendingUp className="h-4 w-4" />
								<span>+12.5% from last period</span>
							</div>
						</div>
						<ResponsiveContainer width="100%" height={300}>
							<AreaChart data={revenueData}>
								<defs>
									<linearGradient
										id="revenueGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1">
										<stop
											offset="5%"
											stopColor="hsl(var(--primary))"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="hsl(var(--primary))"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="hsl(var(--border))"
								/>
								<XAxis
									dataKey="date"
									stroke="hsl(var(--muted-foreground))"
									fontSize={12}
								/>
								<YAxis
									stroke="hsl(var(--muted-foreground))"
									fontSize={12}
									tickFormatter={(v) => `KD ${v / 1000}k`}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "hsl(var(--popover))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
									}}
									labelStyle={{ color: "hsl(var(--foreground))" }}
									formatter={(value: number) => [
										`KD ${value.toLocaleString()}`,
										"Revenue",
									]}
								/>
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="hsl(var(--primary))"
									strokeWidth={2}
									fillOpacity={1}
									fill="url(#revenueGradient)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					{/* Order Status Pie Chart */}
					<div className="glass-card p-6">
						<h3 className="text-lg font-semibold text-foreground mb-6">
							Order Status
						</h3>
						<ResponsiveContainer width="100%" height={200}>
							<PieChart>
								<Pie
									data={orderStatusData}
									cx="50%"
									cy="50%"
									innerRadius={50}
									outerRadius={80}
									paddingAngle={2}
									dataKey="count">
									{orderStatusData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									contentStyle={{
										backgroundColor: "hsl(var(--popover))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
						<div className="flex flex-wrap gap-3 mt-4 justify-center">
							{orderStatusData.map((item) => (
								<div key={item.status} className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: item.color }}
									/>
									<span className="text-xs text-muted-foreground">
										{item.status}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Second Row */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Categories Chart */}
					<div className="glass-card p-6">
						<h3 className="text-lg font-semibold text-foreground mb-6">
							Top Categories
						</h3>
						<ResponsiveContainer width="100%" height={250}>
							<BarChart data={categoryData} layout="vertical">
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="hsl(var(--border))"
									horizontal={false}
								/>
								<XAxis
									type="number"
									stroke="hsl(var(--muted-foreground))"
									fontSize={12}
								/>
								<YAxis
									dataKey="name"
									type="category"
									stroke="hsl(var(--muted-foreground))"
									fontSize={12}
									width={80}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "hsl(var(--popover))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "8px",
									}}
									formatter={(value: number) => [value, "Items"]}
								/>
								<Bar
									dataKey="count"
									fill="hsl(var(--primary))"
									radius={[0, 4, 4, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Recent Orders */}
					<div className="glass-card p-6">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-semibold text-foreground">
								Recent Orders
							</h3>
							<a
								href="/orders"
								className="text-sm text-primary flex items-center gap-1 hover:underline">
								View all
							</a>
						</div>
						<div className="space-y-4">
							{recentOrders.map((order) => (
								<div
									key={order.id}
									className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
									<div className="flex items-center gap-4">
										<div>
											<p className="font-medium text-foreground">{order.id}</p>
											<p className="text-sm text-muted-foreground">
												{order.customer}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-medium text-foreground">
											KD {order.total.toFixed(2)}
										</p>
										<StatusBadge status={order.status} />
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Top Sellers */}
				<div className="glass-card p-6">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-semibold text-foreground">
							Top Sellers
						</h3>
						<a
							href="/sellers"
							className="text-sm text-primary flex items-center gap-1 hover:underline">
							View all
						</a>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						{topSellers.map((seller, index) => (
							<div
								key={seller.name}
								className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
								<div className="flex items-center gap-3 mb-3">
									<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
										#{index + 1}
									</div>
									<p className="font-medium text-foreground truncate">
										{seller.name}
									</p>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-muted-foreground">
										{seller.sales} sales
									</p>
									<p className="text-lg font-semibold text-foreground">
										KD {seller.revenue.toLocaleString()}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
