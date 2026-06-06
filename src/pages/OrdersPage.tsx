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
  availableStock: number;
};

function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

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

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [customersRes, productsRes] =
      await Promise.all([
        api.get('/customers'),
        api.get('/products'),
      ]);

    setCustomers(customersRes.data);
    setProducts(productsRes.data);
  }

  function addItem() {
    const product = products.find(
      (p) => p.id === Number(productId),
    );

    if (!product) {
      alert('Seleccioná un producto');
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      alert('Ingresá una cantidad válida');
      return;
    }

    // Calcular cuánto stock ya está en el carrito para ese producto
    const existingItem = items.find(
      (i) => i.productId === product.id,
    );

    const alreadyInCart = existingItem
      ? existingItem.quantity
      : 0;

    const totalRequested = alreadyInCart + qty;

    if (totalRequested > product.stock) {
      alert(
        `Stock insuficiente para "${product.name}".\n` +
        `Disponible: ${product.stock}` +
        (alreadyInCart > 0
          ? ` (ya tenés ${alreadyInCart} en el carrito)`
          : ''),
      );
      return;
    }

    // Si ya existe el producto en el carrito, sumar cantidad
    if (existingItem) {
      setItems(
        items.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + qty,
                subtotal:
                  i.unitPrice * (i.quantity + qty),
              }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          name: product.name,
          quantity: qty,
          unitPrice: Number(product.salePrice),
          subtotal: Number(product.salePrice) * qty,
          availableStock: product.stock,
        },
      ]);
    }

    setProductId('');
    setQuantity('');
  }

  function removeItem(productId: number) {
    setItems(
      items.filter((i) => i.productId !== productId),
    );
  }

  async function createOrder() {
    if (!customerId) {
      alert('Seleccioná un cliente');
      return;
    }

    if (items.length === 0) {
      alert('Agregá productos al pedido');
      return;
    }

    setLoading(true);

    try {
      await api.post('/orders', {
        customerId: Number(customerId),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      alert('Pedido creado correctamente');

      setCustomerId('');
      setItems([]);

      // Recargar productos para tener el stock actualizado
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);

    } catch (error: any) {
      const msg =
        error.response?.data?.message;

      if (Array.isArray(msg)) {
        alert('Error: ' + msg.join('\n'));
      } else if (typeof msg === 'string') {
        alert('Error: ' + msg);
      } else {
        alert('Ocurrió un error al crear el pedido');
      }

      console.error(error.response?.data);
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce(
    (acc, item) => acc + item.subtotal,
    0,
  );

  const selectedProduct = products.find(
    (p) => p.id === Number(productId),
  );

  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Nuevo Pedido
      </h1>

      {/* Formulario */}
      <div className="bg-gray-800 p-6 rounded-2xl mb-8">

        <div className="grid md:grid-cols-4 gap-4">

          {/* Cliente */}
          <select
            value={customerId}
            onChange={(e) =>
              setCustomerId(e.target.value)
            }
            className="p-3 rounded-lg bg-gray-700"
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

          {/* Producto */}
          <select
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value)
            }
            className="p-3 rounded-lg bg-gray-700"
          >
            <option value="">
              Seleccionar Producto
            </option>
            {products
              .filter((p) => p.stock > 0)
              .map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name} — stock: {product.stock}
                </option>
              ))}
          </select>

          {/* Cantidad */}
          <input
            type="number"
            placeholder="Cantidad"
            value={quantity}
            min={1}
            max={selectedProduct?.stock ?? undefined}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            className="p-3 rounded-lg bg-gray-700"
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

        {/* Info stock del producto seleccionado */}
        {selectedProduct && (
          <p className="mt-3 text-sm text-gray-400">
            Stock disponible de{' '}
            <span className="text-white font-bold">
              {selectedProduct.name}
            </span>
            :{' '}
            <span
              className={
                selectedProduct.stock <= 5
                  ? 'text-red-400 font-bold'
                  : 'text-green-400 font-bold'
              }
            >
              {selectedProduct.stock} unidades
            </span>
            {' — '}Precio: {formatARS(Number(selectedProduct.salePrice))}
          </p>
        )}
      </div>

      {/* Tabla de ítems */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">Cantidad</th>
              <th className="p-4 text-left">Precio unit.</th>
              <th className="p-4 text-left">Subtotal</th>
              <th className="p-4 text-center">Quitar</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  No hay productos en el pedido todavía
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.productId}
                  className="border-b border-gray-700"
                >
                  <td className="p-4">{item.name}</td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4">
                    {formatARS(item.unitPrice)}
                  </td>
                  <td className="p-4">
                    {formatARS(item.subtotal)}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        removeItem(item.productId)
                      }
                      className="
                        bg-red-600
                        hover:bg-red-700
                        px-3
                        py-1
                        rounded-lg
                        text-sm
                      "
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total y botón */}
      <div className="mt-8 flex justify-between items-center">
        <h2 className="text-3xl font-bold">
          Total: {formatARS(total)}
        </h2>

        <button
          onClick={createOrder}
          disabled={loading}
          className="
            bg-green-600
            hover:bg-green-700
            disabled:bg-gray-600
            disabled:cursor-not-allowed
            px-8
            py-4
            rounded-xl
            font-bold
          "
        >
          {loading ? 'Creando pedido...' : 'Crear Pedido'}
        </button>
      </div>
    </div>
  );
}