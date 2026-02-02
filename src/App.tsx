import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import SellersPage from "./pages/SellersPage";
import ItemsPage from "./pages/ItemsPage";
import OrdersPage from "./pages/OrdersPage";
import TransactionsPage from "./pages/TransactionsPage";
import IncomesPage from "./pages/IncomesPage";
import SalesPage from "./pages/SalesPage";
import ExpensesPage from "./pages/ExpensesPage";
import CategoriesPage from "./pages/CategoriesPage";
import DropsPage from "./pages/DropsPage";
import DiscountsPage from "./pages/DiscountsPage";
import ReviewsPage from "./pages/ReviewsPage";
import SubCategoriesPage from "./pages/SubCategoriesPage";
import CreditCardsPage from "./pages/CreditCardsPage";
import OutfitItemsPage from "./pages/OutfitItemsPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<BrowserRouter>
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
					<Route path="/categories" element={<CategoriesPage />} />
					<Route path="/drops" element={<DropsPage />} />
					<Route path="/discounts" element={<DiscountsPage />} />
					<Route path="/reviews" element={<ReviewsPage />} />
					<Route path="/subcategories" element={<SubCategoriesPage />} />
					<Route path="/creditcards" element={<CreditCardsPage />} />
					<Route path="/outfititems" element={<OutfitItemsPage />} />
					<Route path="*" element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
