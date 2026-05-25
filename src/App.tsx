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

      </Routes>

    </BrowserRouter>
  );
}

export default App;