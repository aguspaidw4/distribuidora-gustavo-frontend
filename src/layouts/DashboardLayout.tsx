import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type NavItem = {
  to: string;
  label: string;
  icon: string;
  roles: string[];
};

const NAV_ITEMS: NavItem[] = [
  { to: '/',               label: 'Dashboard',             icon: '📊', roles: ['ADMIN', 'OWNER'] },
  { to: '/products',       label: 'Productos',             icon: '📦', roles: ['ADMIN', 'OWNER'] },
  { to: '/customers',      label: 'Clientes',              icon: '👥', roles: ['ADMIN', 'OWNER'] },
  { to: '/orders',         label: 'Nuevo Pedido',          icon: '🛒', roles: ['ADMIN', 'OWNER'] },
  { to: '/orders-history', label: 'Historial de Pedidos',  icon: '📋', roles: ['ADMIN', 'OWNER'] },
  { to: '/accounts',       label: 'Cuentas Corrientes',    icon: '💰', roles: ['ADMIN', 'OWNER'] },
  { to: '/payments',       label: 'Pagos',                 icon: '💳', roles: ['ADMIN', 'OWNER'] },
  { to: '/stock',          label: 'Stock',                 icon: '📦', roles: ['ADMIN', 'OWNER'] },
  { to: '/purchases',      label: 'Compras',               icon: '🛍️', roles: ['ADMIN', 'OWNER'] },
  { to: '/price-list',     label: 'Lista de Precios',      icon: '📄', roles: ['ADMIN', 'OWNER'] },
  { to: '/reports',        label: 'Reportes',              icon: '📈', roles: ['ADMIN', 'OWNER'] },
  { to: '/users',          label: 'Usuarios',              icon: '👤', roles: ['ADMIN'] },
  { to: '/my-orders',      label: 'Mis Pedidos',           icon: '📋', roles: ['CLIENT'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role ?? 'OWNER';
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function isActive(to: string): boolean {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  }

  function handleNavClick() {
    setSidebarOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-lg font-bold text-white leading-tight">Distribuidora</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gustavo</p>
        {user && <p className="text-xs text-gray-500 mt-2 truncate">{user.email}</p>}
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={[
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white',
              ].join(' ')}
              style={{ transition: 'background-color 0.15s, color 0.15s' }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <button
          onClick={() => { logout(); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-gray-800 flex-col flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Drawer mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 h-full w-72 bg-gray-800 flex flex-col z-50 md:hidden shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Abrir menú"
          >
            <div className="flex flex-col gap-1.5">
              <span className="block w-6 h-0.5 bg-current" />
              <span className="block w-6 h-0.5 bg-current" />
              <span className="block w-6 h-0.5 bg-current" />
            </div>
          </button>
          <span className="font-bold text-white">Distribuidora Gustavo</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}