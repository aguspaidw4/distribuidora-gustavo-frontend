import {
  useEffect,
  useState,
} from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

import api from '../api/axios';

type TopProduct = {
  productId: number;

  productName: string;

  totalSold: number;
};

export default function ReportsPage() {

  const [products, setProducts] =
    useState<TopProduct[]>([]);

  const [salesByDay, setSalesByDay] =
    useState<any[]>([]);

  useEffect(() => {
    loadReport();
  }, []);

    async function loadReport() {

    const productsResponse =
        await api.get(
        '/reports/top-products',
        );

    const salesResponse =
        await api.get(
        '/reports/sales-by-day',
        );

    setProducts(
        productsResponse.data,
    );

    setSalesByDay(
        salesResponse.data,
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
        Productos Más Vendidos
      </h1>

      <div
        className="
            bg-gray-800
            rounded-2xl
            p-6
            mb-8
        "
        >

        <h2
            className="
            text-2xl
            font-bold
            mb-6
            "
        >
            Top Productos
        </h2>

        <div className="h-96">

            <ResponsiveContainer
            width="100%"
            height="100%"
            >

            <BarChart data={products}>

                <XAxis
                dataKey="productName"
                />

                <YAxis />

                <Tooltip />

                <Bar
                dataKey="totalSold"
                />

            </BarChart>

            </ResponsiveContainer>
        </div>
    </div>

    <div
        className="
            bg-gray-800
            rounded-2xl
            p-6
            mb-8
        "
        >

        <h2
            className="
            text-2xl
            font-bold
            mb-6
            "
        >
            Ventas por Día
        </h2>

        <div className="h-96">

            <ResponsiveContainer
            width="100%"
            height="100%"
            >

            <LineChart
                data={salesByDay}
            >

                <XAxis
                dataKey="date"
                />

                <YAxis />

                <Tooltip />

                <Line
                type="monotone"
                dataKey="totalSales"
                />

            </LineChart>

            </ResponsiveContainer>
        </div>
    </div>

      <div className="space-y-4">

        {products.map((product) => (

          <div
            key={product.productId}

            className="
              bg-gray-800
              p-6
              rounded-2xl
              flex
              justify-between
              items-center
            "
          >

            <div>

              <h2
                className="
                  text-2xl
                  font-bold
                "
              >
                {
                  product.productName
                }
              </h2>
            </div>

            <div
              className="
                text-3xl
                font-bold
                text-green-400
              "
            >
              {
                product.totalSold
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}