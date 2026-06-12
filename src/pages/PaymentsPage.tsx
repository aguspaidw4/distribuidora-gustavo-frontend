import { useEffect, useState } from 'react';
import api from '../api/axios';

type Summary = {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockProducts: number;
  pendingPayments: number;
  totalPurchases: number;
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(Number(value));
}

function Card({ title, value, color }: { title: string; value: string | number; color?: string }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
      <h2 className="text-gray-400 text-xs mb-1">{title}</h2>
      <p className={`text-xl font-bold break-all leading-tight ${color ?? 'text-white'}`}>{value}</p>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await api.get('/dashboard/summary');
        setSummary(response.data);
      } catch {}
    }
    loadSummary();
  }, []);

  if (!summary) return <div className="p-10 text-gray-500">Cargando...</div>;

  const pieData = [
    { name: 'Total Vendido', value: summary.totalSales, color: '#22c55e' },
    { name: 'Total Comprado', value: summary.totalPurchases, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  const ganancia = summary.totalSales - summary.totalPurchases;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Pagos</h1>

      {/* Gráfico PRIMERO */}
      {pieData.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold mb-4">Ventas vs Compras</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-1/2 h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={CustomLabel}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [formatARS(Number(value)), '']}
                  />
                  <Legend formatter={(value) => <span style={{ color: '#d1d5db' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              <div className="bg-gray-700 rounded-xl p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Total Vendido</span>
                </div>
                <span className="text-green-400 font-bold">{formatARS(summary.totalSales)}</span>
              </div>
              <div className="bg-gray-700 rounded-xl p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Total Comprado</span>
                </div>
                <span className="text-blue-400 font-bold">{formatARS(summary.totalPurchases)}</span>
              </div>
              <div className={`rounded-xl p-3 flex justify-between items-center ${ganancia >= 0 ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ganancia >= 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-gray-300 text-sm font-bold">Ganancia estimada</span>
                </div>
                <span className={`font-bold text-lg ${ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {ganancia >= 0 ? '+' : ''}{formatARS(ganancia)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cards DESPUÉS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Card title="Ventas Totales" value={formatARS(summary.totalSales)} color="text-green-400" />
        <Card title="Pedidos" value={summary.totalOrders} />
        <Card title="Clientes" value={summary.totalCustomers} />
        <Card title="Sin Stock" value={summary.lowStockProducts} color={summary.lowStockProducts > 0 ? 'text-red-400' : 'text-white'} />
        <Card title="Cobro Pendiente" value={formatARS(summary.pendingPayments)} color={summary.pendingPayments > 0 ? 'text-yellow-400' : 'text-white'} />
      </div>
    </div>
  );
}