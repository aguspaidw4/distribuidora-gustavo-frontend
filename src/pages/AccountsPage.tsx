import { useEffect, useState } from 'react';
import api from '../api/axios';

type Account = {
  customerId: number;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  totalPending: number;
};

type Order = {
  id: number;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  status: string;
  createdAt: string;
  details: {
    id: number;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    presentation: string;
    product: { name: string };
  }[];
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    PARTIAL: 'Pago parcial',
    CANCELLED: 'Cancelado',
  };
  return labels[status] ?? status;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400',
    PAID: 'text-green-400',
    PARTIAL: 'text-blue-400',
    CANCELLED: 'text-red-400',
  };
  return colors[status] ?? 'text-gray-400';
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el panel de pedidos expandido
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  async function loadAccounts() {
    setLoading(true);
    try {
      const response = await api.get('/customers/accounts');
      setAccounts(response.data);
    } catch {
      alert('Error al cargar las cuentas corrientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAccounts(); }, []);

  async function toggleCustomer(customerId: number) {
    // Si ya está abierto, cerrar
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      setOrders([]);
      setExpandedOrderId(null);
      return;
    }

    setExpandedCustomerId(customerId);
    setExpandedOrderId(null);
    setOrders([]);
    setLoadingOrders(true);

    try {
      const res = await api.get(`/customers/${customerId}`);
      setOrders(res.data.orders ?? []);
    } catch {
      alert('Error al cargar los pedidos del cliente');
      setExpandedCustomerId(null);
    } finally {
      setLoadingOrders(false);
    }
  }

  const withDebt = accounts.filter((a) => a.totalPending > 0);
  const noDebt = accounts.filter((a) => a.totalPending === 0);
  const sorted = [
    ...withDebt.sort((a, b) => b.totalPending - a.totalPending),
    ...noDebt,
  ];

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Cuentas Corrientes</h1>
        {!loading && accounts.length > 0 && (
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total pendiente general</p>
            <p className="text-red-400 font-bold text-2xl">
              {formatARS(accounts.reduce((acc, a) => acc + a.totalPending, 0))}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando cuentas...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-12 text-center text-gray-500">
          No hay cuentas corrientes registradas todavía
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((account) => {
            const isExpanded = expandedCustomerId === account.customerId;
            return (
              <div
                key={account.customerId}
                className={`bg-gray-800 rounded-2xl overflow-hidden border-l-4 ${
                  account.totalPending > 0 ? 'border-red-500' : 'border-green-500'
                }`}
              >
                {/* Tarjeta clickeable */}
                <button
                  onClick={() => toggleCustomer(account.customerId)}
                  className="w-full p-6 text-left hover:bg-gray-750 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold mb-3">{account.customerName}</h2>
                      <div className="flex gap-6 text-sm">
                        <span className="text-gray-400">
                          Pedidos: <span className="text-white font-bold">{account.totalOrders}</span>
                        </span>
                        <span className="text-gray-400">
                          Total comprado: <span className="text-white font-bold">{formatARS(account.totalSpent)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-gray-400 text-xs mb-1">Pendiente</p>
                        <p className={`font-bold text-lg ${account.totalPending > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {account.totalPending > 0 ? formatARS(account.totalPending) : 'Al día ✓'}
                        </p>
                      </div>
                      <span className="text-gray-400 text-lg">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {/* Panel de pedidos expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-700 px-6 pb-6">
                    {loadingOrders ? (
                      <p className="text-gray-500 text-center py-6">Cargando pedidos...</p>
                    ) : orders.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">Este cliente no tiene pedidos</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-gray-400 mb-3">
                          {orders.length} pedido{orders.length !== 1 ? 's' : ''} registrados
                        </p>
                        {orders
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((order) => (
                            <div key={order.id} className="bg-gray-700 rounded-xl overflow-hidden">
                              {/* Fila del pedido */}
                              <button
                                onClick={() => setExpandedOrderId(
                                  expandedOrderId === order.id ? null : order.id
                                )}
                                className="w-full p-4 text-left hover:bg-gray-600 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-4">
                                    <span className="text-white font-bold">Pedido #{order.id}</span>
                                    <span className="text-gray-400 text-sm">{formatDate(order.createdAt)}</span>
                                    <span className={`text-sm font-bold ${statusColor(order.status)}`}>
                                      {statusLabel(order.status)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-white font-bold">{formatARS(order.total)}</span>
                                    {Number(order.pendingAmount) > 0 && (
                                      <span className="text-red-400 font-bold">
                                        Debe: {formatARS(order.pendingAmount)}
                                      </span>
                                    )}
                                    <span className="text-gray-400">{expandedOrderId === order.id ? '▲' : '▼'}</span>
                                  </div>
                                </div>
                              </button>

                              {/* Detalle del pedido */}
                              {expandedOrderId === order.id && (
                                <div className="px-4 pb-4 border-t border-gray-600">
                                  <table className="w-full text-sm mt-3">
                                    <thead>
                                      <tr className="text-gray-400 border-b border-gray-600">
                                        <th className="text-left pb-2">Producto</th>
                                        <th className="text-left pb-2">Present.</th>
                                        <th className="text-left pb-2">Cant.</th>
                                        <th className="text-left pb-2">Precio unit.</th>
                                        <th className="text-left pb-2">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.details.map((d) => (
                                        <tr key={d.id} className="border-b border-gray-600 last:border-0">
                                          <td className="py-2">{d.product.name}</td>
                                          <td className="py-2 text-gray-400">{d.presentation ?? 'UNIDAD'}</td>
                                          <td className="py-2">{d.quantity}</td>
                                          <td className="py-2 text-gray-400">{formatARS(d.unitPrice)}</td>
                                          <td className="py-2 font-bold">{formatARS(d.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}