import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
	LayoutDashboard,
	Users,
	Store,
	Package,
	ShoppingCart,
	CreditCard,
	FolderTree,
	Folders,
	Zap,
	Ticket,
	Star,
	Menu,
	X,
	Banknote,
	FileText,
	Receipt,
	Briefcase,
	Truck,
	Mail,
	History,
	LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
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
	{ name: "Employees", href: "/employees", icon: Briefcase },
	{ name: "Categories", href: "/categories", icon: FolderTree },
	{ name: "Subcategories", href: "/subcategories", icon: Folders },
	{ name: "Drops", href: "/drops", icon: Zap },
	{ name: "Discount Codes", href: "/discounts", icon: Ticket },
	{ name: "Reviews", href: "/reviews", icon: Star },
	{ name: "Shipping", href: "/shipping", icon: Truck },
	{ name: "Newsletter", href: "/newsletter", icon: Mail },
	{ name: "Logs", href: "/logs", icon: History },
];

export function AdminSidebar() {
	const location = useLocation();
	const navigate = useNavigate();
	const { logout } = useAuth();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [isDesktop, setIsDesktop] = useState(() =>
		typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
	);

	useEffect(() => {
		const onResize = () => setIsDesktop(window.innerWidth >= 1024);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const isCompact = isDesktop && collapsed;

	return (
		<>
			{/* Mobile overlay */}
			<div
				className={cn(
					"fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden",
					mobileOpen ? "block" : "hidden",
				)}
				onClick={() => setMobileOpen(false)}
			/>

			{/* Mobile toggle button */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed left-3 top-3 z-50 rounded-md border border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden"
				onClick={() => setMobileOpen(!mobileOpen)}
				aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}>
				{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
			</Button>

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300",
					"lg:translate-x-0",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
					collapsed ? "lg:w-16" : "lg:w-64",
				)}>
				{/* Logo — click to expand / collapse (desktop); mobile overlay button still opens/closes */}
				<div
					className={cn(
						"flex h-16 items-center border-b border-sidebar-border",
						isCompact ? "justify-center px-2" : "px-4",
					)}>
					<button
						type="button"
						onClick={() => setCollapsed(!collapsed)}
						className={cn(
							"flex items-center gap-2 rounded-md p-1.5 text-left outline-none transition-colors",
							"hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
							isCompact ? "justify-center" : "min-w-0 w-full",
						)}
						aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
						<img
							src={logoUrl}
							alt=""
							className="h-7 w-7 shrink-0 object-contain"
						/>
						{!isCompact && (
							<span className="truncate text-sm font-semibold text-foreground tracking-wide">
								Erlume Backoffice
							</span>
						)}
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex flex-col h-[calc(100vh-4rem)] py-4 px-2">
					<ul className="flex-1 space-y-1 overflow-y-auto">
						{navigation.map((item) => {
							const isActive = location.pathname === item.href;
							return (
								<li key={item.name}>
									<NavLink
										to={item.href}
										onClick={() => setMobileOpen(false)}
										className={cn(
											"sidebar-link",
											isActive && "sidebar-link-active",
										)}
										title={isCompact ? item.name : undefined}>
										<item.icon className="h-5 w-5 flex-shrink-0" />
										{!isCompact && <span>{item.name}</span>}
									</NavLink>
								</li>
							);
						})}
					</ul>
					<div className="pt-2 border-t border-sidebar-border">
						<button
							type="button"
							onClick={() => { logout(); navigate("/login"); }}
							className={cn(
								"sidebar-link w-full text-muted-foreground hover:text-destructive",
								isCompact ? "justify-center" : "",
							)}
							title={isCompact ? "Sign out" : undefined}>
							<LogOut className="h-5 w-5 flex-shrink-0" />
							{!isCompact && <span>Sign out</span>}
						</button>
					</div>
				</nav>
			</aside>
		</>
	);
}

export default AdminSidebar;
