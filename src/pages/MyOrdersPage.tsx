import { useEffect, useState } from 'react';
import api from '../api/axios';

type OrderDetail = {
  id: number;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product: { name: string };
};

type Order = {
  id: number;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  status: string;
  createdAt: string;
  details: OrderDetail[];
};

type Customer = {
  id: number;
  name: string;
  orders: Order[];
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export default function MyOrdersPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyCustomer() {
      try {
        const res = await api.get('/customers/my-customer');
        setCustomer(res.data);
      } catch {
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    }
    loadMyCustomer();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 py-24">
        Cargando tus pedidos...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold mb-4">Mis Pedidos</h1>
        <div className="bg-gray-800 rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">
            Tu cuenta aún no está vinculada a un cliente
          </p>
          <p className="text-gray-500 text-sm">
            Contactá al administrador para que vincule tu usuario con tu registro de cliente.
          </p>
        </div>
      </div>
    );
  }

  const orders = customer.orders ?? [];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Mis Pedidos</h1>
      <p className="text-gray-400 mb-8">
        {customer.name} — {orders.length} pedido{orders.length !== 1 ? 's' : ''}
      </p>

      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-12 text-center text-gray-500">
          No tenés pedidos registrados todavía
        </div>
      ) : (
        <div className="space-y-6">
          {orders
            .sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .map((order) => (
              <div key={order.id} className="bg-gray-800 rounded-2xl overflow-hidden">
                <div className="p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Pedido #{order.id}</h2>
                    <p className="text-gray-400 text-sm">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right space-y-1 text-sm">
                    <p className="text-gray-400">
                      Total: <span className="text-white font-bold">{formatARS(order.total)}</span>
                    </p>
                    <p className="text-gray-400">
                      Pagado: <span className="text-green-400">{formatARS(order.paidAmount)}</span>
                    </p>
                    {Number(order.pendingAmount) > 0 && (
                      <p className="text-red-400 font-bold">
                        Pendiente: {formatARS(order.pendingAmount)}
                      </p>
                    )}
                    <p className={`font-bold ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === order.id ? null : order.id)
                    }
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
                  >
                    {expandedId === order.id ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>

                  {expandedId === order.id && (
                    <div className="mt-4 bg-gray-700 rounded-xl p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-600">
                            <th className="text-left pb-2">Producto</th>
                            <th className="text-left pb-2">Cantidad</th>
                            <th className="text-left pb-2">Precio unit.</th>
                            <th className="text-left pb-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.details.map((detail) => (
                            <tr key={detail.id} className="border-b border-gray-600 last:border-0">
                              <td className="py-2">{detail.product.name}</td>
                              <td className="py-2">{detail.quantity}</td>
                              <td className="py-2 text-gray-400">{formatARS(detail.unitPrice)}</td>
                              <td className="py-2 font-bold">{formatARS(detail.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}