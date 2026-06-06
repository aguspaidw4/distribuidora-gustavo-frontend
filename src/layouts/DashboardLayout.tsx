import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type NavItem = {
  to: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/',               label: 'Dashboard',         icon: '📊' },
  { to: '/products',       label: 'Productos',         icon: '📦' },
  { to: '/customers',      label: 'Clientes',          icon: '👥' },
  { to: '/orders',         label: 'Nuevo Pedido',      icon: '🛒' },
  { to: '/orders-history', label: 'Historial',         icon: '📋' },
  { to: '/accounts',       label: 'Cuentas Corrientes',icon: '💰' },
  { to: '/payments',       label: 'Pagos',             icon: '💳' },
  { to: '/reports',        label: 'Reportes',          icon: '📈' },
  { to: '/stock',          label: 'Stock',             icon: '📦' },
  { to: '/purchases',      label: 'Compras',           icon: '🛍️' },
  { to: '/price-list',     label: 'Lista de Precios',  icon: '📄' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const location = useLocation();

  function isActive(to: string): boolean {
    if (to === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(to);
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">

      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 flex flex-col">

        {/* Logo / nombre */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white leading-tight">
            Distribuidora
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Gustavo
          </p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex items-center gap-3
                px-4 py-2.5
                rounded-lg
                text-sm font-medium
                transition-colors
                ${isActive(item.to)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="
              w-full
              flex items-center gap-3
              px-4 py-2.5
              rounded-lg
              text-sm font-medium
              text-gray-400
              hover:bg-red-600
              hover:text-white
              transition-colors
            "
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}