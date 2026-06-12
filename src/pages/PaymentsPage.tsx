import { useEffect, useState } from 'react';
import api from '../api/axios';

type Order = {
  id: number;
  total: string;
  pendingAmount: string;
  status: string;
  customer: { name: string };
};
type Payment = {
  id: number;
  amount: string;
  method: string;
  createdAt: string;
  order: { id: number };
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(Number(value));
}
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function methodLabel(method: string): string {
  return { CASH: 'Efectivo', TRANSFER: 'Transferencia', MERCADOPAGO: 'MercadoPago', NARANJAX: 'NaranjaX' }[method] ?? method;
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [ordersRes, paymentsRes] = await Promise.all([api.get('/orders'), api.get('/payments')]);
      setOrders(ordersRes.data);
      setPayments(paymentsRes.data);
    } catch { alert('Error al cargar los datos'); }
  }

  const selectedOrder = orders.find((o) => o.id === Number(orderId));
  const pendingOrders = orders.filter((o) => Number(o.pendingAmount) > 0);

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) { alert('Seleccioná un pedido'); return; }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) { alert('Ingresá un monto válido'); return; }
    if (selectedOrder && amountNum > Number(selectedOrder.pendingAmount)) {
      alert(`El monto no puede superar el pendiente de ${formatARS(selectedOrder.pendingAmount)}`);
      return;
    }
    setLoading(true);
    try {
      await api.post('/payments', { orderId: Number(orderId), amount: amountNum, method });
      alert('Pago registrado correctamente');
      setOrderId(''); setAmount(''); setMethod('CASH');
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'Error al registrar el pago');
    } finally { setLoading(false); }
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Pagos</h1>

      <form onSubmit={createPayment} className="bg-gray-800 p-4 md:p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-bold mb-4">Registrar pago</h2>

        {/* Stacked en mobile, grid en desktop */}
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
          <select value={orderId} onChange={(e) => { setOrderId(e.target.value); setAmount(''); }}
            className="w-full p-3 rounded-lg bg-gray-700 text-sm">
            <option value="">Seleccionar Pedido</option>
            {pendingOrders.map((order) => (
              <option key={order.id} value={order.id}>
                #{order.id} — {order.customer?.name} ({formatARS(order.pendingAmount)} pend.)
              </option>
            ))}
          </select>

          <div className="relative">
            <input type="number" placeholder="Monto" value={amount}
              min={1} max={selectedOrder ? Number(selectedOrder.pendingAmount) : undefined}
              step="0.01" onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 pr-20 text-sm" />
            {selectedOrder && (
              <button type="button" onClick={() => setAmount(String(selectedOrder.pendingAmount))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-bold bg-gray-600 px-2 py-1 rounded">
                Total
              </button>
            )}
          </div>

          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-sm">
            <option value="CASH">Efectivo</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="MERCADOPAGO">MercadoPago</option>
            <option value="NARANJAX">NaranjaX</option>
          </select>
        </div>

        {selectedOrder && (
          <div className="mt-4 bg-gray-700 p-4 rounded-xl text-sm space-y-1">
            <p className="text-gray-400">Cliente: <span className="text-white font-medium">{selectedOrder.customer?.name}</span></p>
            <p className="text-gray-400">Total del pedido: <span className="text-white font-medium">{formatARS(selectedOrder.total)}</span></p>
            <p className="text-gray-400">Monto pendiente: <span className="text-red-400 font-bold">{formatARS(selectedOrder.pendingAmount)}</span></p>
            {amount && Number(amount) > 0 && (
              <p className="text-gray-400">Quedará pendiente:{' '}
                <span className={Number(selectedOrder.pendingAmount) - Number(amount) === 0 ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
                  {formatARS(Number(selectedOrder.pendingAmount) - Number(amount))}
                </span>
              </p>
            )}
          </div>
        )}

        {pendingOrders.length === 0 && <p className="mt-4 text-gray-500 text-sm">No hay pedidos con deuda pendiente</p>}

        <button type="submit" disabled={loading || pendingOrders.length === 0}
          className="mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold w-full md:w-auto">
          {loading ? 'Registrando...' : 'Registrar Pago'}
        </button>
      </form>

      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700"><h2 className="text-xl font-bold">Historial de pagos</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 text-left">Pedido</th>
                <th className="p-4 text-left">Método</th>
                <th className="p-4 text-left">Monto</th>
                <th className="p-4 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay pagos registrados todavía</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-700">
                    <td className="p-4">#{payment.order.id}</td>
                    <td className="p-4">{methodLabel(payment.method)}</td>
                    <td className="p-4 font-bold text-green-400">{formatARS(payment.amount)}</td>
                    <td className="p-4 text-gray-400 text-sm">{formatDate(payment.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}