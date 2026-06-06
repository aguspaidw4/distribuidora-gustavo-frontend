import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Product = {
  id: number;
  name: string;
  purchasePrice: string;
  profitMargin: string;
  salePrice: string;
  stock: number;
  active: boolean;
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

const EMPTY_FORM = {
  name: '',
  purchasePrice: '',
  profitMargin: '30',
  stock: '',
};

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editId, setEditId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [onlyLowStock, setOnlyLowStock] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

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

  useEffect(() => {
    loadProducts();
  }, []);

  function openNewModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditId(product.id);
    setForm({
      name: product.name,
      purchasePrice: product.purchasePrice,
      profitMargin: product.profitMargin,
      stock: String(product.stock),
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

  // Vista previa del precio de venta calculado
  const previewSalePrice =
    form.purchasePrice && form.profitMargin
      ? Number(form.purchasePrice) *
        (1 + Number(form.profitMargin) / 100)
      : null;

  async function saveProduct(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (Number(form.purchasePrice) <= 0) {
      alert('El precio de compra debe ser mayor a 0');
      return;
    }

    if (
      Number(form.profitMargin) < 0 ||
      Number(form.profitMargin) > 500
    ) {
      alert('El margen debe estar entre 0% y 500%');
      return;
    }

    const payload = {
      name: form.name.trim(),
      purchasePrice: Number(form.purchasePrice),
      profitMargin: Number(form.profitMargin),
      stock: Number(form.stock),
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
    const confirmDelete = confirm(
      `¿Eliminar "${name}"?\nEsta acción no se puede deshacer.`,
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(
        typeof msg === 'string'
          ? 'Error: ' + msg
          : 'No se pudo eliminar el producto',
      );
    }
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Productos
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`
              px-4 py-2 rounded-lg font-bold
              ${onlyLowStock
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-600 hover:bg-gray-500'}
            `}
          >
            {onlyLowStock ? 'Ver todos' : '⚠ Stock bajo'}
          </button>

          <button
            onClick={openNewModal}
            className="
              bg-blue-600
              hover:bg-blue-700
              px-4 py-2
              rounded-lg
              font-bold
            "
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">P. Compra</th>
              <th className="p-4 text-left">Margen</th>
              <th className="p-4 text-left">P. Venta</th>
              <th className="p-4 text-left">Stock</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-500"
                >
                  {onlyLowStock
                    ? 'No hay productos con stock bajo'
                    : 'No hay productos cargados todavía'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-700 hover:bg-gray-750"
                >
                  <td className="p-4 font-medium">
                    {product.name}
                  </td>

                  <td className="p-4 text-gray-400">
                    {formatARS(product.purchasePrice)}
                  </td>

                  <td className="p-4 text-gray-400">
                    {product.profitMargin}%
                  </td>

                  <td className="p-4 font-bold text-green-400">
                    {formatARS(product.salePrice)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`
                        px-3 py-1 rounded-full font-bold text-sm
                        ${product.stock <= 5
                          ? 'bg-red-600'
                          : product.stock <= 10
                          ? 'bg-yellow-600'
                          : 'bg-green-700'}
                      `}
                    >
                      {product.stock}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(product)}
                        className="
                          bg-yellow-600
                          hover:bg-yellow-700
                          px-4 py-2
                          rounded-lg
                          text-sm
                        "
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(product.id, product.name)
                        }
                        className="
                          bg-red-600
                          hover:bg-red-700
                          px-4 py-2
                          rounded-lg
                          text-sm
                        "
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
            className="bg-gray-800 p-8 rounded-2xl w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>

            <label className="block text-sm text-gray-400 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ej: Coca Cola 2.25L"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4"
              required
            />

            <label className="block text-sm text-gray-400 mb-1">
              Precio de compra *
            </label>
            <input
              type="number"
              name="purchasePrice"
              placeholder="Ej: 2500"
              value={form.purchasePrice}
              onChange={handleChange}
              min={0}
              step="0.01"
              className="w-full p-3 rounded-lg bg-gray-700 mb-4"
              required
            />

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
              className="w-full p-3 rounded-lg bg-gray-700 mb-4"
            />

            {/* Preview precio de venta */}
            {previewSalePrice !== null && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg text-sm">
                Precio de venta calculado:{' '}
                <span className="text-green-400 font-bold text-base">
                  {formatARS(previewSalePrice)}
                </span>
              </div>
            )}

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
                className="
                  flex-1
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-gray-600
                  disabled:cursor-not-allowed
                  p-3
                  rounded-lg
                  font-bold
                "
              >
                {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="
                  flex-1
                  bg-gray-600
                  hover:bg-gray-500
                  disabled:cursor-not-allowed
                  p-3
                  rounded-lg
                "
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