import { useCallback, useMemo, useState } from "react";
import { ShoppingCart, Users, Package, TrendingUp, Store, Receipt, ChevronDown } from "lucide-react";
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";
import { cn } from "@/lib/utils";
import type {
	Category,
	Expense,
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

// Fixed rate — update as needed (1 USD in KWD)
const USD_TO_KWD = 0.307;

const EXPENSE_COLORS: Record<string, string> = {
	subscriptions: "hsl(var(--primary))",
	supplies: "hsl(var(--chart-2))",
	services: "hsl(var(--chart-3))",
	"subscriptions,services": "hsl(var(--chart-4))",
};

export default function DashboardPage() {
	// ─── Data loaders ─────────────────────────────────────────────────────────
	const loadUsers = useCallback(() => restApi.users.getAll() as Promise<User[]>, []);
	const loadItems = useCallback(() => restApi.items.getAll() as Promise<Item[]>, []);
	const loadOrders = useCallback(() => restApi.orders.getAll() as Promise<Order[]>, []);
	const loadSellers = useCallback(() => restApi.sellers.getAll() as Promise<Seller[]>, []);
	const loadCategories = useCallback(() => restApi.categories.getAll() as Promise<Category[]>, []);
	const loadTransactions = useCallback(() => restApi.transactions.getAll() as Promise<Transaction[]>, []);
	const loadSales = useCallback(() => restApi.sales.getAll() as Promise<Sale[]>, []);
	const loadExpenses = useCallback(() => restApi.expenses.getAll() as Promise<Expense[]>, []);

	const { data: users, loading: usersLoading, error: usersError } = useResourceList(loadUsers);
	const { data: items, loading: itemsLoading, error: itemsError } = useResourceList(loadItems);
	const { data: orders, loading: ordersLoading, error: ordersError } = useResourceList(loadOrders);
	const { data: sellers, loading: sellersLoading, error: sellersError } = useResourceList(loadSellers);
	const { data: categories, loading: categoriesLoading, error: categoriesError } = useResourceList(loadCategories);
	const { data: transactions, loading: transactionsLoading, error: transactionsError } = useResourceList(loadTransactions);
	const { data: sales, loading: salesLoading, error: salesError } = useResourceList(loadSales);
	const { data: expenses } = useResourceList<Expense>(loadExpenses);

	const loading = usersLoading || itemsLoading || ordersLoading || sellersLoading || categoriesLoading || transactionsLoading || salesLoading;
	const error = usersError || itemsError || ordersError || sellersError || categoriesError || transactionsError || salesError;

	// ─── Tab + expense filter state ───────────────────────────────────────────
	const [activeTab, setActiveTab] = useState<"overview" | "expenses">("overview");

	const nowDate = new Date();
	const [expenseYear, setExpenseYear] = useState(String(nowDate.getFullYear()));
	const [expenseType, setExpenseType] = useState("all");
	const [expenseMonth, setExpenseMonth] = useState(
		`${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, "0")}`,
	);
	// null = no bar selected → all bars fully lit; string = selected bar key
	const [selectedBar, setSelectedBar] = useState<string | null>(null);

	// ─── Overview KPIs ────────────────────────────────────────────────────────
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

		const currentOrders = orders.filter((order) => new Date(order.createdAt) >= sevenDaysAgo).length;
		const previousOrders = orders.filter((order) => {
			const created = new Date(order.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		const currentUsers = users.filter((user) => new Date(user.createdAt) >= sevenDaysAgo).length;
		const previousUsers = users.filter((user) => {
			const created = new Date(user.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		const currentItems = items.filter((item) => new Date(item.createdAt) >= sevenDaysAgo).length;
		const previousItems = items.filter((item) => {
			const created = new Date(item.createdAt);
			return created >= fourteenDaysAgo && created < sevenDaysAgo;
		}).length;

		const currentRevenue = deliveredSales
			.filter((sale) => getSaleDate(sale) >= sevenDaysAgo)
			.reduce((sum, sale) => sum + getSaleCommission(sale), 0);
		const previousRevenue = deliveredSales
			.filter((sale) => {
				if (!sale.createdAt && !sale.sale_date) return false;
				const saleDate = getSaleDate(sale);
				return saleDate >= fourteenDaysAgo && saleDate < sevenDaysAgo;
			})
			.reduce((sum, sale) => sum + getSaleCommission(sale), 0);

		const totalSellers = sellers.length;
		const currentSellers = sellers.filter((s) => new Date(s.createdAt) >= sevenDaysAgo).length;
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
			if (!isDelivered || (!sale.createdAt && !sale.sale_date)) return;
			const key = toDateKey(getSaleDate(sale));
			const current = totals.get(key) ?? { revenue: 0, orders: 0 };
			current.revenue += getSaleCommission(sale);
			totals.set(key, current);
		});

		return days.map((date) => {
			const key = toDateKey(date);
			const totalsForDay = totals.get(key) ?? { revenue: 0, orders: 0 };
			return {
				date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
				revenue: totalsForDay.revenue,
				orders: totalsForDay.orders,
			};
		});
	}, [orders, sales]);

	const categoryData = useMemo(() => {
		const categoriesById = new Map(
			categories.map((category) => [category._id, category.name]),
		);
		const totals = new Map<string, { name: string; count: number; revenue: number }>();

		items.forEach((item) => {
			const name =
				categoriesById.get(item.category_id) ||
				item.category_id ||
				"Uncategorized";
			const current = totals.get(item.category_id) ?? { name, count: 0, revenue: 0 };
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
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
							? ((userRef as { emailAddress?: string; phoneNumber?: string; _id?: string }).emailAddress ??
								(userRef as { phoneNumber?: string; _id?: string }).phoneNumber ??
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
		const sellerStatsByUserId = new Map<string, { sales: number; revenue: number }>();
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

			const sellerRef = (item as Item & { sellerId?: string }).sellerId ?? item.seller_id ?? "";
			const sellerRefId = getRefId(sellerRef);
			if (!sellerRefId) return;
			const sellerUserId = sellerUserIdBySellerDocId.get(sellerRefId) ?? sellerRefId;

			const current = sellerStatsByUserId.get(sellerUserId) ?? { sales: 0, revenue: 0 };
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

	// ─── Expense computations ─────────────────────────────────────────────────

	/** Available years derived from expense data */
	const availableYears = useMemo(() => {
		const years = new Set<number>();
		expenses.forEach((e) => {
			if (e.month) years.add(new Date(e.month).getFullYear());
		});
		years.add(new Date().getFullYear());
		return Array.from(years).sort((a, b) => b - a);
	}, [expenses]);

	/** Summary + bar chart data — supports "all" years or a specific year */
	const yearlyExpenseData = useMemo(() => {
		const isAll = expenseYear === "all";

		// 1. Type-filter the whole expense list
		const typeScoped =
			expenseType === "all"
				? expenses
				: expenses.filter((e) =>
						(e.type ?? []).some((t) =>
							t.toLowerCase().includes(expenseType.toLowerCase()),
						),
					);

		// 2. Year-filter (skip if "all")
		const scoped = isAll
			? typeScoped
			: typeScoped.filter((e) => e.month && new Date(e.month).getFullYear() === parseInt(expenseYear, 10));

		const totalUSD = scoped
			.filter((e) => e.currency === "USD")
			.reduce((sum, e) => sum + (parseFloat(String(e.cost)) || 0), 0);
		const totalKWD = scoped
			.filter((e) => !e.currency || e.currency === "KWD")
			.reduce((sum, e) => sum + (parseFloat(String(e.cost)) || 0), 0);

		// 3. Bars — per-year when "all", per-month when a year is selected
		const bars = isAll
			? [...availableYears].reverse().map((y) => {
					const items = scoped.filter((e) => e.month && new Date(e.month).getFullYear() === y);
					const usd = items.filter((e) => e.currency === "USD").reduce((s, e) => s + (parseFloat(String(e.cost)) || 0), 0);
					const kwd = items.filter((e) => !e.currency || e.currency === "KWD").reduce((s, e) => s + (parseFloat(String(e.cost)) || 0), 0);
					return { label: String(y), usd: parseFloat(usd.toFixed(2)), kwd: parseFloat(kwd.toFixed(3)), count: items.length };
			  })
			: MONTH_LABELS.map((label, i) => {
					const items = scoped.filter((e) => e.month && new Date(e.month).getMonth() === i);
					const usd = items.filter((e) => e.currency === "USD").reduce((s, e) => s + (parseFloat(String(e.cost)) || 0), 0);
					const kwd = items.filter((e) => !e.currency || e.currency === "KWD").reduce((s, e) => s + (parseFloat(String(e.cost)) || 0), 0);
					return { label, usd: parseFloat(usd.toFixed(2)), kwd: parseFloat(kwd.toFixed(3)), count: items.length };
			  });

		// 4. By-type breakdown
		const byType: Record<string, number> = {};
		scoped.forEach((e) => {
			(e.type ?? ["other"]).forEach((t) => {
				byType[t] = (byType[t] ?? 0) + (parseFloat(String(e.cost)) || 0);
			});
		});

		return { totalUSD, totalKWD, bars, byType, count: scoped.length, isAll };
	}, [expenses, expenseYear, expenseType, availableYears]);

	/** Month drill-down (individual records) */
	const monthlyExpenseData = useMemo(() => {
		const filtered = expenses.filter((e) => {
			if (!e.month) return false;
			const d = new Date(e.month);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			return key === expenseMonth;
		});

		const scoped =
			expenseType === "all"
				? filtered
				: filtered.filter((e) =>
						(e.type ?? []).some((t) =>
							t.toLowerCase().includes(expenseType.toLowerCase()),
						),
					);

		const totalUSD = scoped
			.filter((e) => e.currency === "USD")
			.reduce((sum, e) => sum + (parseFloat(String(e.cost)) || 0), 0);
		const totalKWD = scoped
			.filter((e) => !e.currency || e.currency === "KWD")
			.reduce((sum, e) => sum + (parseFloat(String(e.cost)) || 0), 0);

		return { list: scoped, totalUSD, totalKWD };
	}, [expenses, expenseType, expenseMonth]);

	// ─── Render ───────────────────────────────────────────────────────────────

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

				{/* Tab navigation */}
				<div className="flex gap-0 border-b border-border">
					{(["overview", "expenses"] as const).map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setActiveTab(tab)}
							className={cn(
								"flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2",
								activeTab === tab
									? "border-primary text-foreground"
									: "border-transparent text-muted-foreground hover:text-foreground",
							)}>
							{tab === "overview" ? (
								<><TrendingUp className="h-4 w-4" />Overview</>
							) : (
								<><Receipt className="h-4 w-4" />Expenses</>
							)}
						</button>
					))}
				</div>

				{/* ═══════════════════════════════════════════════════════════
				    OVERVIEW TAB
				════════════════════════════════════════════════════════════ */}
				{activeTab === "overview" && (
					<div className="space-y-6">
						{/* KPI Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
							<KpiCard
								title="Total Revenue"
								value={dashboardKpis.totalRevenue}
								change={dashboardKpis.revenueChange}
								trend="up"
								format="currency"
								icon={<span className="text-lg font-semibold text-primary">KD</span>}
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
										<h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
										<p className="text-sm text-muted-foreground">Daily revenue for the last 14 days</p>
									</div>
									<div className="flex items-center gap-2 text-success text-sm">
										<TrendingUp className="h-4 w-4" />
										<span>+12.5% from last period</span>
									</div>
								</div>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={revenueData}>
										<defs>
											<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
												<stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
										<XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
										<YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `KD ${v / 1000}k`} />
										<Tooltip
											contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
											labelStyle={{ color: "hsl(var(--foreground))" }}
											formatter={(value: number) => [`KD ${value.toLocaleString()}`, "Revenue"]}
										/>
										<Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#revenueGradient)" />
									</AreaChart>
								</ResponsiveContainer>
							</div>

							{/* Order Status Pie */}
							<div className="glass-card p-6">
								<h3 className="text-lg font-semibold text-foreground mb-6">Order Status</h3>
								<ResponsiveContainer width="100%" height={200}>
									<PieChart>
										<Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="count">
											{orderStatusData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
									</PieChart>
								</ResponsiveContainer>
								<div className="flex flex-wrap gap-3 mt-4 justify-center">
									{orderStatusData.map((item) => (
										<div key={item.status} className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
											<span className="text-xs text-muted-foreground">{item.status}</span>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Second Row */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Categories Chart */}
							<div className="glass-card p-6">
								<h3 className="text-lg font-semibold text-foreground mb-6">Top Categories</h3>
								<ResponsiveContainer width="100%" height={250}>
									<BarChart data={categoryData} layout="vertical">
										<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
										<XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
										<YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
										<Tooltip
											contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
											formatter={(value: number) => [value, "Items"]}
										/>
										<Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>

							{/* Recent Orders */}
							<div className="glass-card p-6">
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
									<a href="/orders" className="text-sm text-primary flex items-center gap-1 hover:underline">View all</a>
								</div>
								<div className="space-y-4">
									{recentOrders.map((order) => (
										<div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
											<div className="flex items-center gap-4">
												<div>
													<p className="font-medium text-foreground">{order.id}</p>
													<p className="text-sm text-muted-foreground">{order.customer}</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-medium text-foreground">KD {order.total.toFixed(2)}</p>
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
								<h3 className="text-lg font-semibold text-foreground">Top Sellers</h3>
								<a href="/sellers" className="text-sm text-primary flex items-center gap-1 hover:underline">View all</a>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
								{topSellers.map((seller, index) => (
									<div key={seller.name} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
												#{index + 1}
											</div>
											<p className="font-medium text-foreground truncate">{seller.name}</p>
										</div>
										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">{seller.sales} sales</p>
											<p className="text-lg font-semibold text-foreground">KD {seller.revenue.toLocaleString()}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* ═══════════════════════════════════════════════════════════
				    EXPENSES TAB
				════════════════════════════════════════════════════════════ */}
				{activeTab === "expenses" && (
					<div className="space-y-6">
						{/* Filters */}
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-muted-foreground">Year</label>
								<div className="relative">
									<select
										value={expenseYear}
										onChange={(e) => {
											const val = e.target.value;
											setExpenseYear(val);
											setSelectedBar(null);
											if (val !== "all") {
												setExpenseMonth(`${val}-${expenseMonth.slice(5, 7)}`);
											}
										}}
										className="h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm text-foreground appearance-none cursor-pointer">
										<option value="all">All years</option>
										{availableYears.map((y) => (
											<option key={y} value={String(y)}>{y}</option>
										))}
									</select>
									<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								</div>
							</div>

							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-muted-foreground">Type</label>
								<div className="relative">
									<select
										value={expenseType}
										onChange={(e) => setExpenseType(e.target.value)}
										className="h-9 rounded-md border border-input bg-background pl-3 pr-8 text-sm text-foreground appearance-none cursor-pointer">
										<option value="all">All types</option>
										<option value="subscriptions">Subscriptions</option>
										<option value="supplies">Supplies</option>
										<option value="services">Services</option>
									</select>
									<ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
								</div>
							</div>
						</div>

						{/* Yearly summary cards */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div className="glass-card p-4 col-span-2 sm:col-span-1">
								<p className="text-xs text-muted-foreground mb-1">
									Total USD{yearlyExpenseData.isAll ? " — all time" : ` ${expenseYear}`}
								</p>
								<p className="text-2xl font-bold text-foreground">${yearlyExpenseData.totalUSD.toFixed(2)}</p>
								<p className="text-xs text-muted-foreground mt-1">
									≈ KD {(yearlyExpenseData.totalUSD * USD_TO_KWD).toFixed(3)} · {yearlyExpenseData.count} records
								</p>
							</div>
							<div className="glass-card p-4 col-span-2 sm:col-span-1">
								<p className="text-xs text-muted-foreground mb-1">
									Total KWD{yearlyExpenseData.isAll ? " — all time" : ` ${expenseYear}`}
								</p>
								<p className="text-2xl font-bold text-foreground">KD {yearlyExpenseData.totalKWD.toFixed(3)}</p>
								<p className="text-xs text-muted-foreground mt-1">&nbsp;</p>
							</div>
							{Object.entries(yearlyExpenseData.byType).map(([type, amount]) => (
								<div key={type} className="glass-card p-4">
									<p className="text-xs text-muted-foreground mb-1 capitalize">{type}</p>
									<p className="text-lg font-semibold text-foreground">
										{expenses.find((e) => (e.type ?? []).includes(type) && e.currency === "USD") ? "$" : "KD "}
										{amount.toFixed(2)}
									</p>
								</div>
							))}
						</div>

						{/* Bar chart — monthly or yearly */}
						<div className="glass-card p-6">
							<h3 className="text-lg font-semibold text-foreground mb-1">
								{yearlyExpenseData.isAll ? "Yearly breakdown — all time" : `Monthly breakdown — ${expenseYear}`}
							</h3>
							<p className="text-sm text-muted-foreground mb-6">
								{yearlyExpenseData.isAll ? "Click a year to drill down" : "Click a bar to see month detail · click again to deselect"}
							</p>
							<ResponsiveContainer width="100%" height={240}>
								<BarChart
									data={yearlyExpenseData.bars}
									barSize={yearlyExpenseData.isAll ? 40 : 28}
									style={{ cursor: "pointer" }}
									onClick={(data) => {
										if (!data?.activeLabel) return;
										if (yearlyExpenseData.isAll) {
											// clicking a year bar drills into that year
											setExpenseYear(data.activeLabel as string);
											setSelectedBar(null);
										} else {
											// clicking a month bar selects/deselects it
											const idx = MONTH_LABELS.indexOf(data.activeLabel as string);
											if (idx >= 0) {
												const mm = String(idx + 1).padStart(2, "0");
												const key = `${expenseYear}-${mm}`;
												setExpenseMonth(key);
												setSelectedBar((prev) => (prev === key ? null : key));
											}
										}
									}}>
									<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
									<XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
									<YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
									<Tooltip
										contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
										labelStyle={{ color: "hsl(var(--foreground))" }}
										formatter={(value: number, name: string) => [
											name === "usd" ? `$${value.toFixed(2)}` : `KD ${value.toFixed(3)}`,
											name.toUpperCase(),
										]}
										cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
									/>
									<Bar dataKey="usd" name="usd" radius={[4, 4, 0, 0]}>
										{yearlyExpenseData.bars.map((_entry, idx) => {
											let isLit = true;
											if (!yearlyExpenseData.isAll && selectedBar !== null) {
												const mm = String(idx + 1).padStart(2, "0");
												isLit = selectedBar === `${expenseYear}-${mm}`;
											}
											return (
												<Cell
													key={`usd-${idx}`}
													fill={isLit ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.35)"}
												/>
											);
										})}
									</Bar>
									{yearlyExpenseData.totalKWD > 0 && (
										<Bar dataKey="kwd" name="kwd" radius={[4, 4, 0, 0]}>
											{yearlyExpenseData.bars.map((_entry, idx) => {
												let isLit = true;
												if (!yearlyExpenseData.isAll && selectedBar !== null) {
													const mm = String(idx + 1).padStart(2, "0");
													isLit = selectedBar === `${expenseYear}-${mm}`;
												}
												return (
													<Cell
														key={`kwd-${idx}`}
														fill={isLit ? "hsl(var(--chart-2))" : "hsl(var(--chart-2) / 0.35)"}
													/>
												);
											})}
										</Bar>
									)}
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* Month drill-down — hidden in "all years" mode */}
						{!yearlyExpenseData.isAll && <div className="glass-card p-6">
							<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
								<div>
									<h3 className="text-lg font-semibold text-foreground">Month detail</h3>
									<p className="text-sm text-muted-foreground">
										{monthlyExpenseData.list.length} item{monthlyExpenseData.list.length !== 1 ? "s" : ""} · {expenseMonth}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<input
										type="month"
										value={expenseMonth}
										onChange={(e) => {
											setExpenseMonth(e.target.value);
											// Sync year picker with selected month
											setExpenseYear(e.target.value.slice(0, 4));
										}}
										className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
									/>
									{monthlyExpenseData.totalUSD > 0 && (
										<span className="text-sm font-semibold">
											${monthlyExpenseData.totalUSD.toFixed(2)}
											<span className="text-muted-foreground font-normal text-xs"> USD ≈ KD {(monthlyExpenseData.totalUSD * USD_TO_KWD).toFixed(3)}</span>
										</span>
									)}
									{monthlyExpenseData.totalKWD > 0 && (
										<span className="text-sm font-semibold">KD {monthlyExpenseData.totalKWD.toFixed(3)}</span>
									)}
								</div>
							</div>

							{monthlyExpenseData.list.length === 0 ? (
								<p className="text-sm text-muted-foreground py-6 text-center">No expenses for this month.</p>
							) : (
								<div className="overflow-hidden rounded-lg border border-border">
									<table className="w-full text-sm">
										<thead className="bg-muted/50">
											<tr>
												<th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
												<th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
												<th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Notes</th>
												<th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Cost</th>
											</tr>
										</thead>
										<tbody>
											{monthlyExpenseData.list.map((e, i) => (
												<tr key={e._id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
													<td className="px-4 py-2.5 font-medium text-foreground">{e.name}</td>
													<td className="px-4 py-2.5">
														<div className="flex flex-wrap gap-1">
															{(e.type ?? []).map((t) => (
																<span
																	key={t}
																	className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
																	style={{
																		backgroundColor: `${EXPENSE_COLORS[t] ?? "hsl(var(--muted))"}20`,
																		color: EXPENSE_COLORS[t] ?? "hsl(var(--muted-foreground))",
																	}}>
																	{t}
																</span>
															))}
														</div>
													</td>
													<td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate hidden sm:table-cell">
														{e.notes || "—"}
													</td>
													<td className="px-4 py-2.5 text-right">
														{e.currency === "USD" ? (
															<>
																<span className="font-semibold text-primary">${parseFloat(String(e.cost)).toFixed(2)}</span>
																<span className="block text-xs text-muted-foreground">
																	≈ KD {(parseFloat(String(e.cost)) * USD_TO_KWD).toFixed(3)}
																</span>
															</>
														) : (
															<span className="font-semibold text-primary">KD {parseFloat(String(e.cost)).toFixed(3)}</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
					</div>}
					</div>
				)}
			</div>
		</AdminLayout>
	);
}
