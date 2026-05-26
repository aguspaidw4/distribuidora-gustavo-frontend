import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Customer = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  salePrice: string;
  stock: number;
};

type OrderItem = {
  productId: number;

  name: string;

  quantity: number;

  unitPrice: number;

  subtotal: number;
};

export default function OrdersPage() {

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [customerId, setCustomerId] =
    useState('');

  const [productId, setProductId] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  const [items, setItems] =
    useState<OrderItem[]>([]);

  useEffect(() => {

    loadData();

  }, []);

  async function loadData() {

    const customersResponse =
      await api.get('/customers');

    const productsResponse =
      await api.get('/products');

    setCustomers(
      customersResponse.data,
    );

    setProducts(
      productsResponse.data,
    );
  }

  function addItem() {

    const product =
      products.find(
        (p) =>
          p.id === Number(productId),
      );

    if (!product) {
      return;
    }

    const qty = Number(quantity);

    const subtotal =
      Number(product.salePrice) * qty;

    setItems([
      ...items,

      {
        productId: product.id,

        name: product.name,

        quantity: qty,

        unitPrice:
          Number(product.salePrice),

        subtotal,
      },
    ]);

    setProductId('');
    setQuantity('');
  }

  async function createOrder() {

    try {

      if (!customerId) {

        alert(
          'Seleccioná un cliente',
        );

        return;
      }

      if (items.length === 0) {

        alert(
          'Agregá productos al pedido',
        );

        return;
      }

      await api.post('/orders', {

        customerId:
          Number(customerId),

        items: items.map((item) => ({
          productId:
            item.productId,

          quantity:
            item.quantity,
        })),
      });

      alert(
        'Pedido creado correctamente',
      );

      setCustomerId('');

      setItems([]);

    } catch (error: any) {

      console.error(
        error.response?.data,
      );

      alert(
        JSON.stringify(
          error.response?.data,
        ),
      );
    }
  }

  const total =
    items.reduce(
      (acc, item) =>
        acc + item.subtotal,
      0,
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
        Pedidos
      </h1>

      <div
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
            md:grid-cols-4
            gap-4
          "
        >

          <select
            value={customerId}

            onChange={(e) =>
              setCustomerId(
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
              Seleccionar Cliente
            </option>

            {customers.map((customer) => (

              <option
                key={customer.id}

                value={customer.id}
              >
                {customer.name}
              </option>
            ))}
          </select>

          <select
            value={productId}

            onChange={(e) =>
              setProductId(
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
              Seleccionar Producto
            </option>

            {products.map((product) => (

              <option
                key={product.id}

                value={product.id}
              >
                {product.name}
              </option>
            ))}
          </select>

          <input
            type="number"

            placeholder="Cantidad"

            value={quantity}

            onChange={(e) =>
              setQuantity(
                e.target.value,
              )
            }

            className="
              p-3
              rounded-lg
              bg-gray-700
            "
          />

          <button
            onClick={addItem}

            className="
              bg-blue-600
              hover:bg-blue-700
              rounded-lg
              font-bold
            "
          >
            Agregar
          </button>
        </div>
      </div>

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
                Producto
              </th>

              <th className="p-4 text-left">
                Cantidad
              </th>

              <th className="p-4 text-left">
                Precio
              </th>

              <th className="p-4 text-left">
                Subtotal
              </th>

            </tr>
          </thead>

          <tbody>

            {items.map((item, index) => (

              <tr
                key={index}

                className="
                  border-b
                  border-gray-700
                "
              >

                <td className="p-4">
                  {item.name}
                </td>

                <td className="p-4">
                  {item.quantity}
                </td>

                <td className="p-4">
                  ${item.unitPrice}
                </td>

                <td className="p-4">
                  ${item.subtotal}
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>

      <div
        className="
          mt-8
          flex
          justify-between
          items-center
        "
      >

        <h2
          className="
            text-3xl
            font-bold
          "
        >
          Total: ${total}
        </h2>

        <button
          onClick={createOrder}

          className="
            bg-green-600
            hover:bg-green-700
            px-8
            py-4
            rounded-xl
            font-bold
          "
        >
          Crear Pedido
        </button>
      </div>
    </div>
  );
}