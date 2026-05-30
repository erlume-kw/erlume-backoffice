import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const SellersPage = lazy(() => import("./pages/SellersPage"));
const ItemsPage = lazy(() => import("./pages/ItemsPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const IncomesPage = lazy(() => import("./pages/IncomesPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const DropsPage = lazy(() => import("./pages/DropsPage"));
const DiscountsPage = lazy(() => import("./pages/DiscountsPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const SubCategoriesPage = lazy(() => import("./pages/SubCategoriesPage"));
const CreditCardsPage = lazy(() => import("./pages/CreditCardsPage"));
const OutfitItemsPage = lazy(() => import("./pages/OutfitItemsPage"));
const ShippingPage = lazy(() => import("./pages/ShippingPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const routeFallback = (
	<div className="flex min-h-screen items-center justify-center text-muted-foreground">
		Loading…
	</div>
);

const protect = (el: JSX.Element) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<BrowserRouter>
				<AuthProvider>
					<Suspense fallback={routeFallback}>
						<Routes>
							<Route path="/login" element={<LoginPage />} />
							<Route path="/" element={protect(<DashboardPage />)} />
							<Route path="/users" element={protect(<UsersPage />)} />
							<Route path="/sellers" element={protect(<SellersPage />)} />
							<Route path="/items" element={protect(<ItemsPage />)} />
							<Route path="/orders" element={protect(<OrdersPage />)} />
							<Route path="/transactions" element={protect(<TransactionsPage />)} />
							<Route path="/incomes" element={protect(<IncomesPage />)} />
							<Route path="/sales" element={protect(<SalesPage />)} />
							<Route path="/expenses" element={protect(<ExpensesPage />)} />
							<Route path="/employees" element={protect(<EmployeesPage />)} />
							<Route path="/categories" element={protect(<CategoriesPage />)} />
							<Route path="/drops" element={protect(<DropsPage />)} />
							<Route path="/discounts" element={protect(<DiscountsPage />)} />
							<Route path="/reviews" element={protect(<ReviewsPage />)} />
							<Route path="/subcategories" element={protect(<SubCategoriesPage />)} />
							<Route path="/creditcards" element={protect(<CreditCardsPage />)} />
							<Route path="/outfititems" element={protect(<OutfitItemsPage />)} />
							<Route path="/shipping" element={protect(<ShippingPage />)} />
							<Route path="/newsletter" element={protect(<NewsletterPage />)} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Suspense>
				</AuthProvider>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
