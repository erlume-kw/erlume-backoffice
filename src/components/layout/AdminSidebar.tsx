import { NavLink, useLocation } from "react-router-dom";
import {
	LayoutDashboard,
	Users,
	Store,
	Package,
	ShoppingCart,
	CreditCard,
	FolderTree,
	Zap,
	Ticket,
	Star,
	Menu,
	X,
	Banknote,
	FileText,
	Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoUrl from "../../../erlume_Icon_1_Transparent_green.png";

const navigation = [
	{ name: "Dashboard", href: "/", icon: LayoutDashboard },
	{ name: "Users", href: "/users", icon: Users },
	{ name: "Sellers", href: "/sellers", icon: Store },
	{ name: "Items", href: "/items", icon: Package },
	{ name: "Orders", href: "/orders", icon: ShoppingCart },
	{ name: "Transactions", href: "/transactions", icon: CreditCard },
	{ name: "Incomes", href: "/incomes", icon: Banknote },
	{ name: "Sales", href: "/sales", icon: FileText },
	{ name: "Expenses", href: "/expenses", icon: Receipt },
	{ name: "Categories", href: "/categories", icon: FolderTree },
	{ name: "Drops", href: "/drops", icon: Zap },
	{ name: "Discount Codes", href: "/discounts", icon: Ticket },
	{ name: "Reviews", href: "/reviews", icon: Star },
];

export function AdminSidebar() {
	const location = useLocation();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<>
			{/* Mobile overlay */}
			<div
				className={cn(
					"fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden",
					collapsed ? "hidden" : "block",
				)}
				onClick={() => setCollapsed(true)}
			/>

			{/* Mobile toggle button */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed top-4 left-4 z-50 lg:hidden"
				onClick={() => setCollapsed(!collapsed)}>
				{collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
			</Button>

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
					"lg:translate-x-0",
					collapsed ? "-translate-x-full lg:w-16" : "translate-x-0 w-64",
				)}>
				{/* Logo */}
				<div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
					<div className="flex items-center gap-2">
						<img
							src={logoUrl}
							alt="Erlume logo"
							className="h-7 w-7 shrink-0 object-contain"
						/>
						{!collapsed && (
							<span className="text-sm font-semibold text-foreground tracking-wide">
								Erlume Backoofice
							</span>
						)}
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="hidden lg:flex text-muted-foreground hover:text-foreground"
						onClick={() => setCollapsed(!collapsed)}>
						<Menu className="h-5 w-5" />
					</Button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 overflow-y-auto py-4 px-2">
					<ul className="space-y-1">
						{navigation.map((item) => {
							const isActive = location.pathname === item.href;
							return (
								<li key={item.name}>
									<NavLink
										to={item.href}
										className={cn(
											"sidebar-link",
											isActive && "sidebar-link-active",
										)}
										title={collapsed ? item.name : undefined}>
										<item.icon className="h-5 w-5 flex-shrink-0" />
										{!collapsed && <span>{item.name}</span>}
									</NavLink>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* Footer */}
				<div className="border-t border-sidebar-border p-4">
					{!collapsed && (
						<div className="flex items-center gap-3">
							<div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
								<span className="text-xs font-medium text-primary">AD</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground truncate">
									Admin User
								</p>
								<p className="text-xs text-muted-foreground truncate">
									admin@marketplace.com
								</p>
							</div>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}

export default AdminSidebar;
