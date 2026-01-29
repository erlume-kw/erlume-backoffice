import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import SellersPage from "./pages/SellersPage";
import ItemsPage from "./pages/ItemsPage";
import OrdersPage from "./pages/OrdersPage";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import DropsPage from "./pages/DropsPage";
import DiscountsPage from "./pages/DiscountsPage";
import ReviewsPage from "./pages/ReviewsPage";
import OutfitsPage from "./pages/OutfitsPage";
import DemandsPage from "./pages/DemandsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/sellers" element={<SellersPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/drops" element={<DropsPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/outfits" element={<OutfitsPage />} />
          <Route path="/demands" element={<DemandsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
