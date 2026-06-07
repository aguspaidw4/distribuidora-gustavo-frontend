import { useEffect, useState } from 'react';
import api from '../api/axios';

type Product = {
  id: number;
  name: string;
  profitMargin: string;
  purchasePriceUnit: string | null;
  purchasePriceTira: string | null;
  purchasePriceCaja: string | null;
  salePriceUnit: string | null;
  salePriceTira: string | null;
  salePriceCaja: string | null;
  stock: number;
  active: boolean;
};

function formatARS(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

const EMPTY_FORM = {
  name: '',
  profitMargin: '30',
  stock: '',
  purchasePriceUnit: '',
  purchasePriceTira: '',
  purchasePriceCaja: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredProducts = onlyLowStock
    ? products.filter((p) => p.stock <= 5)
    : products;

  async function loadProducts() {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch {
      alert('Error al cargar los productos');
    }
  }

  useEffect(() => { loadProducts(); }, []);

  function openNewModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditId(product.id);
    setForm({
      name: product.name,
      profitMargin: product.profitMargin,
      stock: String(product.stock),
      purchasePriceUnit: product.purchasePriceUnit ?? '',
      purchasePriceTira: product.purchasePriceTira ?? '',
      purchasePriceCaja: product.purchasePriceCaja ?? '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const margin = Number(form.profitMargin) || 0;

  const previewUnit = form.purchasePriceUnit
    ? Number(form.purchasePriceUnit) * (1 + margin / 100)
    : null;

  const previewTira = form.purchasePriceTira
    ? Number(form.purchasePriceTira) * (1 + margin / 100)
    : null;

  const previewCaja = form.purchasePriceCaja
    ? Number(form.purchasePriceCaja) * (1 + margin / 100)
    : null;

  const hasAtLeastOne =
    form.purchasePriceUnit ||
    form.purchasePriceTira ||
    form.purchasePriceCaja;

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (!hasAtLeastOne) {
      alert('Ingresá al menos un precio de presentación (Unidad, Tira o Caja)');
      return;
    }

    if (margin < 0 || margin > 500) {
      alert('El margen debe estar entre 0% y 500%');
      return;
    }

    const payload = {
      name: form.name.trim(),
      profitMargin: margin,
      stock: Number(form.stock) || 0,
      purchasePriceUnit: form.purchasePriceUnit
        ? Number(form.purchasePriceUnit)
        : null,
      purchasePriceTira: form.purchasePriceTira
        ? Number(form.purchasePriceTira)
        : null,
      purchasePriceCaja: form.purchasePriceCaja
        ? Number(form.purchasePriceCaja)
        : null,
    };

    setLoading(true);
    try {
      if (editId) {
        await api.put(`/products/${editId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      closeModal();
      loadProducts();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        alert('Error: ' + msg.join('\n'));
      } else if (typeof msg === 'string') {
        alert('Error: ' + msg);
      } else {
        alert('Error al guardar el producto');
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: number, name: string) {
    if (!confirm(`¿Eliminar "${name}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'No se pudo eliminar el producto');
    }
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Productos</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-4 py-2 rounded-lg font-bold ${
              onlyLowStock
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {onlyLowStock ? 'Ver todos' : '⚠ Stock bajo'}
          </button>
          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">Margen</th>
              <th className="p-4 text-left text-green-400">P. Unidad</th>
              <th className="p-4 text-left text-blue-400">P. Tira</th>
              <th className="p-4 text-left text-purple-400">P. Caja</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  {onlyLowStock
                    ? 'No hay productos con stock bajo'
                    : 'No hay productos cargados todavía'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-700">
                  <td className="p-4 font-medium">{product.name}</td>

                  <td className="p-4 text-gray-400">
                    {product.profitMargin}%
                  </td>

                  <td className="p-4 font-bold text-green-400">
                    {formatARS(product.salePriceUnit)}
                  </td>

                  <td className="p-4 font-bold text-blue-400">
                    {formatARS(product.salePriceTira)}
                  </td>

                  <td className="p-4 font-bold text-purple-400">
                    {formatARS(product.salePriceCaja)}
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                      product.stock <= 5
                        ? 'bg-red-600'
                        : product.stock <= 10
                        ? 'bg-yellow-600'
                        : 'bg-green-700'
                    }`}>
                      {product.stock}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(product)}
                        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form
            onSubmit={saveProduct}
            className="bg-gray-800 p-8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            {/* Nombre */}
            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input
              type="text"
              name="name"
              placeholder="Ej: Actron 400"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4"
              required
            />

            {/* Margen */}
            <label className="block text-sm text-gray-400 mb-1">
              Margen de ganancia (%)
            </label>
            <input
              type="number"
              name="profitMargin"
              placeholder="Ej: 30"
              value={form.profitMargin}
              onChange={handleChange}
              min={0}
              max={500}
              step="0.01"
              className="w-full p-3 rounded-lg bg-gray-700 mb-6"
            />

            {/* Presentaciones */}
            <p className="text-sm font-bold text-gray-300 mb-3">
              Precios de compra{' '}
              <span className="text-gray-500 font-normal">
                (completá al menos uno)
              </span>
            </p>

            {/* Unidad */}
            <div className="bg-gray-700 rounded-xl p-4 mb-3">
              <p className="text-sm font-bold text-green-400 mb-2">
                Unidad
              </p>
              <label className="block text-xs text-gray-400 mb-1">
                Precio de compra por unidad
              </label>
              <input
                type="number"
                name="purchasePriceUnit"
                placeholder="Ej: 1248.38"
                value={form.purchasePriceUnit}
                onChange={handleChange}
                min={0}
                step="0.01"
                className="w-full p-3 rounded-lg bg-gray-600"
              />
              {previewUnit !== null && (
                <p className="text-xs text-green-400 mt-2">
                  Precio de venta: <strong>{formatARS(previewUnit)}</strong>
                </p>
              )}
            </div>

            {/* Tira */}
            <div className="bg-gray-700 rounded-xl p-4 mb-3">
              <p className="text-sm font-bold text-blue-400 mb-2">
                Tira
              </p>
              <label className="block text-xs text-gray-400 mb-1">
                Precio de compra por tira
              </label>
              <input
                type="number"
                name="purchasePriceTira"
                placeholder="Ej: 2496.77"
                value={form.purchasePriceTira}
                onChange={handleChange}
                min={0}
                step="0.01"
                className="w-full p-3 rounded-lg bg-gray-600"
              />
              {previewTira !== null && (
                <p className="text-xs text-blue-400 mt-2">
                  Precio de venta: <strong>{formatARS(previewTira)}</strong>
                </p>
              )}
            </div>

            {/* Caja */}
            <div className="bg-gray-700 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-purple-400 mb-2">
                Caja
              </p>
              <label className="block text-xs text-gray-400 mb-1">
                Precio de compra por caja
              </label>
              <input
                type="number"
                name="purchasePriceCaja"
                placeholder="Ej: 4993.54"
                value={form.purchasePriceCaja}
                onChange={handleChange}
                min={0}
                step="0.01"
                className="w-full p-3 rounded-lg bg-gray-600"
              />
              {previewCaja !== null && (
                <p className="text-xs text-purple-400 mt-2">
                  Precio de venta: <strong>{formatARS(previewCaja)}</strong>
                </p>
              )}
            </div>

            {/* Stock */}
            <label className="block text-sm text-gray-400 mb-1">
              Stock inicial
            </label>
            <input
              type="number"
              name="stock"
              placeholder="Ej: 50"
              value={form.stock}
              onChange={handleChange}
              min={0}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6"
            />

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold"
              >
                {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}