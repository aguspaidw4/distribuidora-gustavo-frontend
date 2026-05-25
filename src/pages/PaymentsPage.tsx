import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Order = {
  id: number;

  total: string;

  pendingAmount: string;

  status: string;

  customer: {
    name: string;
  };
};

type Payment = {
  id: number;

  amount: string;

  method: string;

  createdAt: string;

  order: {
    id: number;
  };
};

export default function PaymentsPage() {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [orderId, setOrderId] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [method, setMethod] =
    useState('CASH');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {

    const ordersResponse =
      await api.get('/orders');

    const paymentsResponse =
      await api.get('/payments');

    setOrders(ordersResponse.data);

    setPayments(paymentsResponse.data);
  }

  async function createPayment(
    e: React.FormEvent,
  ) {

    e.preventDefault();

    await api.post('/payments', {
      orderId: Number(orderId),

      amount: Number(amount),

      method,
    });

    alert('Pago registrado');

    setOrderId('');

    setAmount('');

    setMethod('CASH');

    loadData();
  }

  const selectedOrder =
    orders.find(
      (order) =>
        order.id === Number(orderId),
    );

  return (
    <div className="p-8">

      <h1
        className="
          text-4xl
          font-bold
          mb-8
        "
      >
        Pagos
      </h1>

      <form
        onSubmit={createPayment}

        className="
          bg-gray-800
          p-6
          rounded-2xl
          mb-8
        "
      >

        <div
          className="
            grid
            md:grid-cols-3
            gap-4
          "
        >

          <select
            value={orderId}

            onChange={(e) =>
              setOrderId(
                e.target.value,
              )
            }

            className="
              p-3
              rounded-lg
              bg-gray-700
            "
          >

            <option value="">
              Seleccionar Pedido
            </option>

            {orders.map((order) => (

              <option
                key={order.id}

                value={order.id}
              >
                Pedido #{order.id} - {' '}
                {order.customer?.name}
              </option>
            ))}
          </select>

          <input
            type="number"

            placeholder="Monto"

            value={amount}

            onChange={(e) =>
              setAmount(
                e.target.value,
              )
            }

            className="
              p-3
              rounded-lg
              bg-gray-700
            "
          />

          <select
            value={method}

            onChange={(e) =>
              setMethod(
                e.target.value,
              )
            }

            className="
              p-3
              rounded-lg
              bg-gray-700
            "
          >

            <option value="CASH">
              Efectivo
            </option>

            <option value="TRANSFER">
              Transferencia
            </option>

            <option value="MERCADOPAGO">
              MercadoPago
            </option>

          </select>
        </div>

        {
          selectedOrder && (

            <div
              className="
                mt-6
                bg-gray-700
                p-4
                rounded-xl
              "
            >

              <p>
                Cliente:
                {' '}
                {
                  selectedOrder.customer?.name
                }
              </p>

              <p>
                Total:
                {' '}
                $
                {
                  selectedOrder.total
                }
              </p>

              <p>
                Pendiente:
                {' '}
                $
                {
                  selectedOrder.pendingAmount
                }
              </p>

              <p>
                Estado:
                {' '}
                {
                  selectedOrder.status
                }
              </p>
            </div>
          )
        }

        <button
          className="
            mt-6
            bg-green-600
            hover:bg-green-700
            px-6
            py-3
            rounded-lg
            font-bold
          "
        >
          Registrar Pago
        </button>
      </form>

      <div
        className="
          bg-gray-800
          rounded-2xl
          overflow-hidden
        "
      >

        <table className="w-full">

          <thead
            className="
              bg-gray-700
            "
          >

            <tr>

              <th className="p-4 text-left">
                Pedido
              </th>

              <th className="p-4 text-left">
                Método
              </th>

              <th className="p-4 text-left">
                Monto
              </th>

              <th className="p-4 text-left">
                Fecha
              </th>

            </tr>
          </thead>

          <tbody>

            {payments.map((payment) => (

              <tr
                key={payment.id}

                className="
                  border-b
                  border-gray-700
                "
              >

                <td className="p-4">
                  #{payment.order.id}
                </td>

                <td className="p-4">
                  {payment.method}
                </td>

                <td className="p-4">
                  ${payment.amount}
                </td>

                <td className="p-4">
                  {
                    new Date(
                      payment.createdAt,
                    ).toLocaleString()
                  }
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}