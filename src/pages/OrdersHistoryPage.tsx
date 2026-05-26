import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Order = {
  id: number;

  total: string;

  paidAmount: string;

  pendingAmount: string;

  status: string;

  createdAt: string;

  customer: {
    name: string;
  };

  details: {
    id: number;

    quantity: number;

    subtotal: string;

    product: {
      name: string;
    };
  }[];
};

export default function OrdersHistoryPage() {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {

    const response =
      await api.get('/orders');

    setOrders(response.data);
  }

  function toggleExpand(id: number) {

    if (expandedId === id) {

      setExpandedId(null);

    } else {

      setExpandedId(id);
    }
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
        Historial Pedidos
      </h1>

      <div className="space-y-6">

        {orders.map((order) => (

          <div
            key={order.id}

            className="
              bg-gray-800
              rounded-2xl
              overflow-hidden
            "
          >

            <div
              className="
                p-6
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
                  Pedido #{order.id}
                </h2>

                <p>
                  Cliente:
                  {' '}
                  {
                    order.customer?.name
                  }
                </p>

                <p>
                  Fecha:
                  {' '}
                  {
                    new Date(
                      order.createdAt,
                    ).toLocaleString()
                  }
                </p>
              </div>

              <div className="text-right">

                <p>
                  Total:
                  {' '}
                  ${order.total}
                </p>

                <p>
                  Pagado:
                  {' '}
                  ${order.paidAmount}
                </p>

                <p>
                  Pendiente:
                  {' '}
                  ${order.pendingAmount}
                </p>

                <p
                  className={`
                    font-bold

                    ${
                      order.status === 'PAID'
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }
                  `}
                >
                  {order.status}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">

              <button
                onClick={() =>
                  toggleExpand(
                    order.id,
                  )
                }

                className="
                  bg-blue-600
                  hover:bg-blue-700
                  px-4
                  py-2
                  rounded-lg
                "
              >
                {
                  expandedId === order.id
                    ? 'Ocultar Detalle'
                    : 'Ver Detalle'
                }
              </button>
              <button
                onClick={async () => {

                  const response =
                    await api.get(
                      `/orders/${order.id}/pdf`,
                      {
                        responseType: 'blob',
                      },
                    );

                  const url =
                    window.URL.createObjectURL(
                      new Blob([response.data]),
                    );

                  const link =
                    document.createElement('a');

                  link.href = url;

                  link.setAttribute(
                    'download',
                    `pedido-${order.id}.pdf`,
                  );

                  document.body.appendChild(link);

                  link.click();

                  link.remove();
                }}

                className="
                  ml-4
                  bg-green-600
                  hover:bg-green-700
                  px-4
                  py-2
                  rounded-lg
                "
              >
                PDF
              </button>

              {
                expandedId === order.id && (

                  <div
                    className="
                      mt-6
                      bg-gray-700
                      rounded-xl
                      p-4
                    "
                  >

                    <table className="w-full">

                      <thead>

                        <tr>

                          <th className="text-left pb-2">
                            Producto
                          </th>

                          <th className="text-left pb-2">
                            Cantidad
                          </th>

                          <th className="text-left pb-2">
                            Subtotal
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {
                          order.details.map(
                            (detail) => (

                              <tr
                                key={detail.id}
                              >

                                <td className="py-2">
                                  {
                                    detail.product.name
                                  }
                                </td>

                                <td className="py-2">
                                  {
                                    detail.quantity
                                  }
                                </td>

                                <td className="py-2">
                                  $
                                  {
                                    detail.subtotal
                                  }
                                </td>

                              </tr>
                            ),
                          )
                        }

                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}