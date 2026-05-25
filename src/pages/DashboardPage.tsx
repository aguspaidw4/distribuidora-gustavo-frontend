import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Summary = {
  totalSales: number;

  totalOrders: number;

  totalCustomers: number;

  lowStockProducts: number;

  pendingPayments: number;
};

export default function DashboardPage() {

  const [summary, setSummary] =
    useState<Summary | null>(null);

  useEffect(() => {

    async function loadSummary() {

      const response =
        await api.get(
          '/dashboard/summary',
        );

      setSummary(response.data);
    }

    loadSummary();

  }, []);

  if (!summary) {
    return (
      <div className="p-10">
        Cargando...
      </div>
    );
  }

  return (
    <div className="p-8">

      <h1
        className="
          text-4xl
          font-bold
          mb-8
        "
      >
        Dashboard
      </h1>

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-5
          gap-6
        "
      >

        <Card
          title="Ventas Totales"
          value={`$${summary.totalSales}`}
        />

        <Card
          title="Pedidos"
          value={summary.totalOrders}
        />

        <Card
          title="Clientes"
          value={summary.totalCustomers}
        />

        <Card
          title="Stock Bajo"
          value={summary.lowStockProducts}
        />

        <Card
          title="Pendiente"
          value={`$${summary.pendingPayments}`}
        />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;

  value: string | number;
}) {

  return (
    <div
      className="
        bg-gray-800
        rounded-2xl
        p-6
        shadow-lg
      "
    >

      <h2
        className="
          text-gray-400
          mb-2
        "
      >
        {title}
      </h2>

      <p
        className="
          text-3xl
          font-bold
        "
      >
        {value}
      </p>
    </div>
  );
}