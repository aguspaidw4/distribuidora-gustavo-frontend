import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Product = {
  id: number;
  name: string;
  stock: number;
};

type StockMovement = {
  id: number;
  quantity: number;
  type: string;
  reason: string;
  createdAt: string;
  product: {
    id: number;
    name: string;
  };
};

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    ENTRY: 'Entrada',
    PURCHASE: 'Compra',
    ADJUSTMENT: 'Ajuste',
    EXIT: 'Salida',
    SALE: 'Venta',
  };
  return labels[type] ?? type;
}

function typeColor(type: string): string {
  const colors: Record<string, string> = {
    ENTRY: 'text-green-400',
    PURCHASE: 'text-green-400',
    ADJUSTMENT: 'text-blue-400',
    EXIT: 'text-red-400',
    SALE: 'text-red-400',
  };
  return colors[type] ?? 'text-gray-400';
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

const EMPTY_FORM = {
  productId: '',
  quantity: '',
  type: 'ENTRY',
  reason: '',
};

export default function StockPage() {
  const [movements, setMovements] =
    useState<StockMovement[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  async function loadData() {
    try {
      const [movRes, prodRes] = await Promise.all([
        api.get('/stock'),
        api.get('/products'),
      ]);
      setMovements(movRes.data);
      setProducts(prodRes.data);
    } catch {
      alert('Error al cargar los movimientos de stock');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function createMovement(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!form.productId) {
      alert('Seleccioná un producto');
      return;
    }

    if (!Number(form.quantity) || Number(form.quantity) <= 0) {
      alert('Ingresá una cantidad válida');
      return;
    }

    const selectedProduct = products.find(
      (p) => p.id === Number(form.productId),
    );

    // Validar stock suficiente para salidas manuales
    if (
      (form.type === 'EXIT' || form.type === 'SALE') &&
      selectedProduct &&
      Number(form.quantity) > selectedProduct.stock
    ) {
      alert(
        `Stock insuficiente para "${selectedProduct.name}".\n` +
        `Disponible: ${selectedProduct.stock}`,
      );
      return;
    }

    setLoading(true);

    try {
      await api.post('/stock', {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        type: form.type,
        reason: form.reason.trim() || undefined,
      });

      setForm(EMPTY_FORM);
      setShowForm(false);
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (typeof msg === 'string') {
        alert('Error: ' + msg);
      } else {
        alert('Error al registrar el movimiento');
      }
    } finally {
      setLoading(false);
    }
  }

  const selectedProduct = products.find(
    (p) => p.id === Number(form.productId),
  );

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Stock
        </h1>

        <button
          onClick={() => setShowForm(!showForm)}
          className="
            bg-blue-600
            hover:bg-blue-700
            px-4 py-2
            rounded-lg
            font-bold
          "
        >
          {showForm ? 'Cancelar' : '+ Ajuste manual'}
        </button>
      </div>

      {/* Formulario ajuste manual */}
      {showForm && (
        <form
          onSubmit={createMovement}
          className="bg-gray-800 p-6 rounded-2xl mb-8"
        >
          <h2 className="text-xl font-bold mb-4">
            Registrar movimiento de stock
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Producto *
              </label>
              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700"
              >
                <option value="">Seleccionar producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — stock actual: {p.stock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Tipo *
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700"
              >
                <option value="ENTRY">Entrada (reposición)</option>
                <option value="ADJUSTMENT">Ajuste (corrección)</option>
                <option value="EXIT">Salida (pérdida / merma)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                name="quantity"
                placeholder="Ej: 10"
                value={form.quantity}
                onChange={handleChange}
                min={1}
                className="w-full p-3 rounded-lg bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Motivo (opcional)
              </label>
              <input
                type="text"
                name="reason"
                placeholder="Ej: Reposición Distribuidora Paola"
                value={form.reason}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-700"
              />
            </div>
          </div>

          {/* Info producto seleccionado */}
          {selectedProduct && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm">
              Stock actual de{' '}
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
              {form.quantity && Number(form.quantity) > 0 && (
                <span className="ml-2 text-gray-400">
                  →{' '}
                  <span className="text-white font-bold">
                    {form.type === 'EXIT'
                      ? selectedProduct.stock - Number(form.quantity)
                      : selectedProduct.stock + Number(form.quantity)}{' '}
                    unidades
                  </span>
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              bg-green-600
              hover:bg-green-700
              disabled:bg-gray-600
              disabled:cursor-not-allowed
              px-6 py-3
              rounded-lg
              font-bold
            "
          >
            {loading ? 'Guardando...' : 'Registrar movimiento'}
          </button>
        </form>
      )}

      {/* Tabla movimientos */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">Tipo</th>
              <th className="p-4 text-left">Cantidad</th>
              <th className="p-4 text-left">Motivo</th>
              <th className="p-4 text-left">Fecha</th>
            </tr>
          </thead>

          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-gray-500"
                >
                  No hay movimientos de stock registrados
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
                <tr
                  key={mov.id}
                  className="border-b border-gray-700"
                >
                  <td className="p-4 font-medium">
                    {mov.product?.name}
                  </td>
                  <td className={`p-4 font-bold ${typeColor(mov.type)}`}>
                    {typeLabel(mov.type)}
                  </td>
                  <td className="p-4">
                    {mov.quantity}
                  </td>
                  <td className="p-4 text-gray-400">
                    {mov.reason || (
                      <span className="text-gray-600 italic">
                        Sin motivo
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {formatDate(mov.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}