import {
  Link,
} from 'react-router-dom';

import {
  useAuth,
} from '../auth/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const {
    logout,
  } = useAuth();

  return (
    <div
      className="
        min-h-screen
        flex
        bg-gray-900
        text-white
      "
    >

      <aside
        className="
          w-64
          bg-gray-800
          p-6
        "
      >

        <h1
          className="
            text-2xl
            font-bold
            mb-10
          "
        >
          Distribuidora
        </h1>

        <nav
          className="
            flex
            flex-col
            gap-4
          "
        >

          <Link to="/">
            Dashboard
          </Link>

          <Link to="/products">
            Productos
          </Link>

          <Link to="/customers">
            Clientes
          </Link>

          <Link to="/orders">
            Pedidos
          </Link>

          <Link to="/payments">
            Pagos
          </Link>

          <button
            onClick={logout}

            className="
              mt-10
              bg-red-600
              p-2
              rounded-lg
            "
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}