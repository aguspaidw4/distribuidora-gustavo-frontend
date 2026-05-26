import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

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

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"

          element={<LoginPage />}
        />

        <Route
          path="/"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <DashboardPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/products"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <ProductsPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <CustomersPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <OrdersPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <PaymentsPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/orders-history"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <OrdersHistoryPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/accounts"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <AccountsPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"

          element={
            <ProtectedRoute>

              <DashboardLayout>

                <ReportsPage />

              </DashboardLayout>

            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;