import { BrowserRouter, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import OrdersHistoryPage from './pages/OrdersHistoryPage';
import AccountsPage from './pages/AccountsPage';
import ReportsPage from './pages/ReportsPage';
import StockPage from './pages/StockPage';
import PurchasesPage from './pages/PurchasesPage';
import PriceListPage from './pages/PriceListPage';
import UsersPage from './pages/UsersPage';
import MyOrdersPage from './pages/MyOrdersPage';

function wrap(Page: React.ReactNode) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {Page}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN + OWNER */}
        <Route path="/"               element={wrap(<DashboardPage />)} />
        <Route path="/products"       element={wrap(<ProductsPage />)} />
        <Route path="/customers"      element={wrap(<CustomersPage />)} />
        <Route path="/orders"         element={wrap(<OrdersPage />)} />
        <Route path="/payments"       element={wrap(<PaymentsPage />)} />
        <Route path="/orders-history" element={wrap(<OrdersHistoryPage />)} />
        <Route path="/accounts"       element={wrap(<AccountsPage />)} />
        <Route path="/reports"        element={wrap(<ReportsPage />)} />
        <Route path="/stock"          element={wrap(<StockPage />)} />
        <Route path="/purchases"      element={wrap(<PurchasesPage />)} />
        <Route path="/price-list"     element={wrap(<PriceListPage />)} />

        {/* Solo ADMIN */}
        <Route path="/users"          element={wrap(<UsersPage />)} />

        {/* Solo CLIENT */}
        <Route path="/my-orders"      element={wrap(<MyOrdersPage />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;