import { useEffect, useState } from 'react';
import api from '../api/axios';

type Order = {
  id: number;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  status: string;
  createdAt: string;
  customer: { name: string };
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
    CANCELLED: 'Cancelado',
    PARTIAL: 'Pago parcial',
  };
  return labels[status] ?? status;
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-400',
    PAID: 'text-green-400',
    CANCELLED: 'text-red-400',
    PARTIAL: 'text-blue-400',
  };
  return colors[status] ?? 'text-gray-400';
}

function presentationBadge(presentation: string) {
  const colors: Record<string, string> = {
    UNIDAD: 'bg-gray-700 text-gray-300',
    TIRA: 'bg-blue-900 text-blue-300',
    CAJA: 'bg-purple-900 text-purple-300',
  };
  const labels: Record<string, string> = {
    UNIDAD: 'Unidad',
    TIRA: 'Tira',
    CAJA: 'Caja',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[presentation] ?? 'bg-gray-700 text-gray-300'}`}>
      {labels[presentation] ?? presentation}
    </span>
  );
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null);

  async function loadOrders() {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch {
      alert('Error al cargar el historial de pedidos');
    }
  }

  useEffect(() => { loadOrders(); }, []);

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  async function downloadPdf(orderId: number) {
    setLoadingPdf(orderId);
    try {
      const response = await api.get(
        `/orders/${orderId}/pdf`,
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pedido-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert(`Error al generar el PDF del pedido #${orderId}`);
    } finally {
      setLoadingPdf(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Historial de Pedidos</h1>

      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-12 text-center text-gray-500">
          No hay pedidos registrados todavía
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-2xl overflow-hidden">

              {/* Cabecera */}
              <div className="p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Pedido #{order.id}</h2>
                  <p className="text-gray-400">
                    Cliente:{' '}
                    <span className="text-white">{order.customer?.name ?? '—'}</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{formatDate(order.createdAt)}</p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-gray-400">
                    Total: <span className="text-white font-bold">{formatARS(order.total)}</span>
                  </p>
                  <p className="text-gray-400">
                    Pagado: <span className="text-green-400">{formatARS(order.paidAmount)}</span>
                  </p>
                  <p className="text-gray-400">
                    Pendiente: <span className="text-red-400 font-bold">{formatARS(order.pendingAmount)}</span>
                  </p>
                  <p className={`font-bold ${statusColor(order.status)}`}>
                    {statusLabel(order.status)}
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                >
                  {expandedId === order.id ? 'Ocultar detalle' : 'Ver detalle'}
                </button>

                <button
                  onClick={() => downloadPdf(order.id)}
                  disabled={loadingPdf === order.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm"
                >
                  {loadingPdf === order.id ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>

              {/* Detalle expandible */}
              {expandedId === order.id && (
                <div className="mx-6 mb-6 bg-gray-700 rounded-xl p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-600">
                        <th className="text-left pb-2">Producto</th>
                        <th className="text-left pb-2">Presentación</th>
                        <th className="text-left pb-2">Cantidad</th>
                        <th className="text-left pb-2">Precio unit.</th>
                        <th className="text-left pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.details.map((detail) => (
                        <tr key={detail.id} className="border-b border-gray-600 last:border-0">
                          <td className="py-2">{detail.product.name}</td>
                          <td className="py-2">
                            {presentationBadge(detail.presentation ?? 'UNIDAD')}
                          </td>
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
          ))}
        </div>
      )}
    </div>
  );
}