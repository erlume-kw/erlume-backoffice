import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<BrowserRouter>
				<Suspense fallback={routeFallback}>
					<Routes>
						<Route path="/login" element={<LoginPage />} />
						<Route path="/" element={<DashboardPage />} />
						<Route path="/users" element={<UsersPage />} />
						<Route path="/sellers" element={<SellersPage />} />
						<Route path="/items" element={<ItemsPage />} />
						<Route path="/orders" element={<OrdersPage />} />
						<Route path="/transactions" element={<TransactionsPage />} />
						<Route path="/incomes" element={<IncomesPage />} />
						<Route path="/sales" element={<SalesPage />} />
						<Route path="/expenses" element={<ExpensesPage />} />
						<Route path="/employees" element={<EmployeesPage />} />
						<Route path="/categories" element={<CategoriesPage />} />
						<Route path="/drops" element={<DropsPage />} />
						<Route path="/discounts" element={<DiscountsPage />} />
						<Route path="/reviews" element={<ReviewsPage />} />
						<Route path="/subcategories" element={<SubCategoriesPage />} />
						<Route path="/creditcards" element={<CreditCardsPage />} />
						<Route path="/outfititems" element={<OutfitItemsPage />} />
						<Route path="/shipping" element={<ShippingPage />} />
						<Route path="/newsletter" element={<NewsletterPage />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Suspense>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
