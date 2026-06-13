import {
  useEffect,
  useState,
} from 'react';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import api from '../api/axios';

type TopProduct = {
  productId: number;
  productName: string;
  totalSold: number;
};

type SalesByDay = {
  date: string;
  totalSales: number;
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

const PIE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6',
];

// Etiqueta personalizada dentro de cada porción
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.05) return null; // no mostrar si la porción es muy pequeña
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ReportsPage() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [salesByDay, setSalesByDay] = useState<SalesByDay[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const [productsRes, salesRes] = await Promise.all([
        api.get('/reports/top-products'),
        api.get('/reports/sales-by-day'),
      ]);
      setProducts(productsRes.data);
      setSalesByDay(salesRes.data);
    } catch {
      alert('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReport(); }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 py-24">
        Cargando reportes...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Reportes</h1>

      {/* Top productos — gráfico de torta */}
      <div className="bg-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Productos más vendidos</h2>

        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No hay datos de ventas todavía
          </p>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={products}
                  dataKey="totalSold"
                  nameKey="productName"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {products.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value, name) => [
                    `${value} unidades`,
                    name,
                  ]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#D1D5DB', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Ventas por día */}
      <div className="bg-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Ventas por día</h2>

        {salesByDay.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No hay datos de ventas por día todavía
          </p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesByDay}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('es-AR', {
                      notation: 'compact',
                      currency: 'ARS',
                    }).format(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [
                    formatARS(Number(value)),
                    'Total ventas',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}