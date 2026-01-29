import { useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/common/StatusBadge';
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
} from 'recharts';

// Mock data for demonstration
const mockKpis = {
  totalRevenue: 284750,
  revenueChange: 12.5,
  totalOrders: 1247,
  ordersChange: 8.3,
  totalUsers: 4521,
  usersChange: 15.2,
  totalItems: 3892,
  itemsChange: -2.1,
};

const revenueData = [
  { date: 'Jan 1', revenue: 12400, orders: 45 },
  { date: 'Jan 2', revenue: 15800, orders: 52 },
  { date: 'Jan 3', revenue: 11200, orders: 38 },
  { date: 'Jan 4', revenue: 18900, orders: 61 },
  { date: 'Jan 5', revenue: 22100, orders: 73 },
  { date: 'Jan 6', revenue: 19500, orders: 65 },
  { date: 'Jan 7', revenue: 24300, orders: 82 },
  { date: 'Jan 8', revenue: 21700, orders: 71 },
  { date: 'Jan 9', revenue: 26800, orders: 89 },
  { date: 'Jan 10', revenue: 23400, orders: 78 },
  { date: 'Jan 11', revenue: 28100, orders: 94 },
  { date: 'Jan 12', revenue: 25600, orders: 85 },
  { date: 'Jan 13', revenue: 31200, orders: 104 },
  { date: 'Jan 14', revenue: 27900, orders: 93 },
];

const categoryData = [
  { name: 'Dresses', count: 456, revenue: 68400 },
  { name: 'Tops', count: 389, revenue: 42790 },
  { name: 'Pants', count: 312, revenue: 37440 },
  { name: 'Shoes', count: 287, revenue: 51660 },
  { name: 'Accessories', count: 245, revenue: 19600 },
];

const orderStatusData = [
  { status: 'Pending', count: 124, color: 'hsl(var(--warning))' },
  { status: 'Processing', count: 89, color: 'hsl(var(--chart-4))' },
  { status: 'Shipped', count: 312, color: 'hsl(var(--primary))' },
  { status: 'Delivered', count: 678, color: 'hsl(var(--success))' },
  { status: 'Cancelled', count: 44, color: 'hsl(var(--destructive))' },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'Sarah Johnson', items: 3, total: 289.99, status: 'processing' },
  { id: 'ORD-002', customer: 'Mike Chen', items: 1, total: 149.00, status: 'shipped' },
  { id: 'ORD-003', customer: 'Emily Davis', items: 5, total: 542.50, status: 'pending' },
  { id: 'ORD-004', customer: 'James Wilson', items: 2, total: 198.00, status: 'delivered' },
  { id: 'ORD-005', customer: 'Lisa Anderson', items: 4, total: 376.25, status: 'processing' },
];

const topSellers = [
  { name: 'Vintage Boutique', sales: 156, revenue: 23400 },
  { name: 'Modern Luxe', sales: 142, revenue: 21300 },
  { name: 'Classic Finds', sales: 128, revenue: 19200 },
  { name: 'Trendy Threads', sales: 115, revenue: 17250 },
  { name: 'Eco Fashion', sales: 98, revenue: 14700 },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your marketplace performance"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Revenue"
            value={mockKpis.totalRevenue}
            change={mockKpis.revenueChange}
            trend="up"
            format="currency"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <KpiCard
            title="Total Orders"
            value={mockKpis.totalOrders}
            change={mockKpis.ordersChange}
            trend="up"
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <KpiCard
            title="Total Users"
            value={mockKpis.totalUsers}
            change={mockKpis.usersChange}
            trend="up"
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            title="Active Items"
            value={mockKpis.totalItems}
            change={mockKpis.itemsChange}
            trend="down"
            icon={<Package className="h-5 w-5" />}
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
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
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
            <h3 className="text-lg font-semibold text-foreground mb-6">Order Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
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
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value, 'Items']}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Orders */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
              <a href="/orders" className="text-sm text-primary flex items-center gap-1 hover:underline">
                View all <ArrowUpRight className="h-4 w-4" />
              </a>
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
                    <p className="font-medium text-foreground">${order.total.toFixed(2)}</p>
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
            <a href="/sellers" className="text-sm text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-4 w-4" />
            </a>
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
                  <p className="text-lg font-semibold text-foreground">${seller.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
