import { useEffect, useState } from 'react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

type Product = {
  id: number;
  name: string;
  profitMargin: string;
  category: string | null;
  weight: string | null;
  purchasePriceUnit: string | null;
  purchasePriceTira: string | null;
  purchasePriceCaja: string | null;
  salePriceUnit: string | null;
  salePriceTira: string | null;
  salePriceCaja: string | null;
  stock: number;
  active: boolean;
};

type ConfirmState = {
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
} | null;

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
  category: '',
  weight: '',
  purchasePriceUnit: '',
  purchasePriceTira: '',
  purchasePriceCaja: '',
};

const PAGE_SIZE = 10;

type SortKey = 'name-asc' | 'name-desc' | 'newer' | 'older' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc';

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const arr = [...products];
  switch (sort) {
    case 'name-asc':   return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':  return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'newer':      return arr.sort((a, b) => b.id - a.id);
    case 'older':      return arr.sort((a, b) => a.id - b.id);
    case 'price-asc':  return arr.sort((a, b) => Number(a.salePriceUnit ?? a.salePriceTira ?? a.salePriceCaja ?? 0) - Number(b.salePriceUnit ?? b.salePriceTira ?? b.salePriceCaja ?? 0));
    case 'price-desc': return arr.sort((a, b) => Number(b.salePriceUnit ?? b.salePriceTira ?? b.salePriceCaja ?? 0) - Number(a.salePriceUnit ?? a.salePriceTira ?? a.salePriceCaja ?? 0));
    case 'stock-asc':  return arr.sort((a, b) => a.stock - b.stock);
    case 'stock-desc': return arr.sort((a, b) => b.stock - a.stock);
    default:           return arr;
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [purchasePricePopup, setPurchasePricePopup] = useState<number | null>(null);

  // Filtros y paginación
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('name-asc');
  const [onlyNoStock, setOnlyNoStock] = useState(false);
  const [page, setPage] = useState(1);

  async function loadProducts() {
    try {
      const [activeRes, deletedRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/deleted'),
      ]);
      setProducts(activeRes.data);
      setDeletedProducts(deletedRes.data);
    } catch {
      setConfirm({
        message: 'Error al cargar los productos',
        confirmLabel: 'Aceptar',
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
        onConfirm: () => setConfirm(null),
      });
    }
  }

  useEffect(() => { loadProducts(); }, []);

  // Reset página al cambiar búsqueda o filtros
  useEffect(() => { setPage(1); }, [search, sort, onlyNoStock]);

  // Filtrado y ordenamiento
  const filtered = sortProducts(
    products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchStock = onlyNoStock ? p.stock === 0 : true;
      return matchSearch && matchStock;
    }),
    sort,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openNewModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditId(product.id);
    setForm({
      name: product.name,
      profitMargin: product.profitMargin,
      stock: String(product.stock),
      category: product.category ?? '',
      weight: product.weight ?? '',
      purchasePriceUnit: product.purchasePriceUnit ?? '',
      purchasePriceTira: product.purchasePriceTira ?? '',
      purchasePriceCaja: product.purchasePriceCaja ?? '',
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  }

  const margin = Number(form.profitMargin) || 0;
  const previewUnit = form.purchasePriceUnit ? Number(form.purchasePriceUnit) * (1 + margin / 100) : null;
  const previewTira = form.purchasePriceTira ? Number(form.purchasePriceTira) * (1 + margin / 100) : null;
  const previewCaja = form.purchasePriceCaja ? Number(form.purchasePriceCaja) * (1 + margin / 100) : null;
  const hasAtLeastOne = form.purchasePriceUnit || form.purchasePriceTira || form.purchasePriceCaja;

  function validateForm(): string | null {
    if (!form.name.trim()) return 'El nombre es obligatorio';
    if (!hasAtLeastOne) return 'Ingresá al menos un precio de presentación';
    if (margin < 0 || margin > 500) return 'El margen debe estar entre 0% y 500%';
    if (form.purchasePriceUnit && Number(form.purchasePriceUnit) < 0) return 'El precio de Unidad no puede ser negativo';
    if (form.purchasePriceTira && Number(form.purchasePriceTira) < 0) return 'El precio de Tira no puede ser negativo';
    if (form.purchasePriceCaja && Number(form.purchasePriceCaja) < 0) return 'El precio de Caja no puede ser negativo';
    if (form.stock && Number(form.stock) < 0) return 'El stock no puede ser negativo';
    return null;
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const error = validateForm();
    if (error) { setFormError(error); return; }

    const payload = {
      name: form.name.trim(),
      profitMargin: margin,
      stock: Number(form.stock) || 0,
      category: form.category.trim() || null,
      weight: form.weight ? Number(form.weight) : null,
      purchasePriceUnit: form.purchasePriceUnit ? Number(form.purchasePriceUnit) : null,
      purchasePriceTira: form.purchasePriceTira ? Number(form.purchasePriceTira) : null,
      purchasePriceCaja: form.purchasePriceCaja ? Number(form.purchasePriceCaja) : null,
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
      if (Array.isArray(msg)) setFormError('Error: ' + msg.join('. '));
      else if (typeof msg === 'string') setFormError('Error: ' + msg);
      else setFormError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(id: number, name: string) {
    setConfirm({
      message: `¿Eliminar "${name}"?`,
      subMessage: 'Podrás recuperarlo desde la sección de productos eliminados.',
      confirmLabel: 'Eliminar',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/products/${id}`);
          loadProducts();
        } catch (error: any) {
          const msg = error.response?.data?.message;
          setConfirm({
            message: typeof msg === 'string' ? msg : 'No se pudo eliminar el producto',
            confirmLabel: 'Aceptar',
            confirmColor: 'bg-blue-600 hover:bg-blue-700',
            onConfirm: () => setConfirm(null),
          });
        }
      },
    });
  }

  function confirmRestore(id: number, name: string) {
    setConfirm({
      message: `¿Restaurar "${name}"?`,
      confirmLabel: 'Restaurar',
      confirmColor: 'bg-orange-600 hover:bg-orange-700',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.patch(`/products/${id}/restore`);
          loadProducts();
        } catch (error: any) {
          const msg = error.response?.data?.message;
          setConfirm({
            message: typeof msg === 'string' ? msg : 'No se pudo restaurar el producto',
            confirmLabel: 'Aceptar',
            confirmColor: 'bg-blue-600 hover:bg-blue-700',
            onConfirm: () => setConfirm(null),
          });
        }
      },
    });
  }

  function stockBadge(stock: number) {
    if (stock === 0) {
      return <span className="px-3 py-1 rounded-full font-bold text-sm bg-red-600">Sin stock</span>;
    }
    return (
      <span className={`px-3 py-1 rounded-full font-bold text-sm ${
        stock <= 10 ? 'bg-yellow-600' : 'bg-green-700'
      }`}>
        {stock}
      </span>
    );
  }

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">Productos</h1>
        <div className="flex flex-wrap gap-2">
          {deletedProducts.length > 0 && (
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${showDeleted ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-500'}`}
            >
              🗑 Eliminados ({deletedProducts.length})
            </button>
          )}
          <button
            onClick={() => { setOnlyNoStock(!onlyNoStock); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${onlyNoStock ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            {onlyNoStock ? 'Ver todos' : '⊘ Sin stock'}
          </button>
          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold text-sm"
          >
            + Nuevo Producto
          </button>
        </div>
      </div>

      {/* Buscador y ordenamiento */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-sm pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="p-3 rounded-lg bg-gray-700 text-sm"
        >
          <option value="name-asc">Nombre A→Z</option>
          <option value="name-desc">Nombre Z→A</option>
          <option value="newer">Más nuevos</option>
          <option value="older">Más viejos</option>
          <option value="price-asc">Precio menor</option>
          <option value="price-desc">Precio mayor</option>
          <option value="stock-asc">Menos stock</option>
          <option value="stock-desc">Más stock</option>
        </select>
      </div>

      {/* Tabla productos activos */}
      <div className="bg-gray-800 rounded-2xl overflow-x-auto mb-4">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-3 text-left w-12 text-gray-500">#</th>
              <th className="p-3 text-left w-28">Stock</th>
              <th className="p-3 text-left">Producto</th>
              <th className="p-3 text-left text-gray-400 w-28">Categoría</th>
              <th className="p-3 text-left text-orange-400 w-28">P. Compra</th>
              <th className="p-3 text-left text-gray-400 w-20">Margen</th>
              <th className="p-3 text-left text-green-400 w-28">Unidad</th>
              <th className="p-3 text-left text-blue-400 w-28">Tira</th>
              <th className="p-3 text-left text-purple-400 w-28">Caja</th>
              <th className="p-3 text-center w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  {search ? `No se encontraron productos para "${search}"` : 'No hay productos cargados todavía'}
                </td>
              </tr>
            ) : (
              paginated.map((product) => (
                <tr key={product.id} className="border-b border-gray-700">
                  <td className="p-3 text-gray-600 text-xs font-mono">#{product.id}</td>
                  <td className="p-3">{stockBadge(product.stock)}</td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3">
                    {product.category ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-indigo-900 text-indigo-300">
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs italic">—</span>
                    )}
                  </td>
                  <td className="p-3 relative">
                    <button
                      onClick={() => setPurchasePricePopup(
                        purchasePricePopup === product.id ? null : product.id
                      )}
                      className="text-orange-400 hover:text-orange-300 text-xs font-bold underline underline-offset-2"
                    >
                      Ver precios
                    </button>
                    {purchasePricePopup === product.id && (
                      <div className="absolute z-20 mt-1 bg-gray-900 border border-gray-600 rounded-xl p-3 shadow-2xl min-w-[200px]">
                        <p className="text-xs text-gray-400 font-bold mb-2">Precios de compra</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-green-400">Unidad:</span>
                            <span className="text-white font-bold">{formatARS(product.purchasePriceUnit)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-blue-400">Tira:</span>
                            <span className="text-white font-bold">{formatARS(product.purchasePriceTira)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-purple-400">Caja:</span>
                            <span className="text-white font-bold">{formatARS(product.purchasePriceCaja)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setPurchasePricePopup(null)}
                          className="mt-2 text-xs text-gray-500 hover:text-gray-300 w-full text-right"
                        >
                          cerrar ✕
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-gray-400 text-sm">{product.profitMargin}%</td>
                  <td className="p-3 font-bold text-green-400 text-sm">{formatARS(product.salePriceUnit)}</td>
                  <td className="p-3 font-bold text-blue-400 text-sm">{formatARS(product.salePriceTira)}</td>
                  <td className="p-3 font-bold text-purple-400 text-sm">{formatARS(product.salePriceCaja)}</td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEditModal(product)} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold">Editar</button>
                      <button onClick={() => confirmDelete(product.id, product.name)} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-8">
          <p className="text-sm text-gray-400">
            {filtered.length} producto{filtered.length !== 1 ? 's' : ''} — pág. {page}/{totalPages}
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              «
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              ‹
            </button>

            {/* Mostrar máximo 3 páginas alrededor de la actual */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-500 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Tabla productos eliminados */}
      {showDeleted && deletedProducts.length > 0 && (
        <div className="bg-gray-800 rounded-2xl overflow-x-auto border border-orange-600/30 mb-8">
          <div className="p-4 border-b border-gray-700 flex items-center gap-2">
            <span className="text-orange-400 font-bold">🗑 Productos Eliminados</span>
            <span className="text-gray-500 text-sm">— podés restaurar cualquiera</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3 text-left w-16">Stock</th>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left text-green-400">Unidad</th>
                <th className="p-3 text-left text-blue-400">Tira</th>
                <th className="p-3 text-left text-purple-400">Caja</th>
                <th className="p-3 text-center">Restaurar</th>
              </tr>
            </thead>
            <tbody>
              {deletedProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-700 opacity-60">
                  <td className="p-3 text-gray-400 text-sm">{product.stock}</td>
                  <td className="p-3 font-medium line-through text-gray-400">{product.name}</td>
                  <td className="p-3 text-green-400 text-sm">{formatARS(product.salePriceUnit)}</td>
                  <td className="p-3 text-blue-400 text-sm">{formatARS(product.salePriceTira)}</td>
                  <td className="p-3 text-purple-400 text-sm">{formatARS(product.salePriceCaja)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => confirmRestore(product.id, product.name)}
                      className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      ↩ Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form onSubmit={saveProduct} className="bg-gray-800 p-8 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editId ? 'Editar Producto' : 'Nuevo Producto'}</h2>

            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input type="text" name="name" placeholder="Ej: Actron 400" value={form.name} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-700 mb-4" required />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Categoría <span className="text-gray-600">(opcional)</span>
                </label>
                <input type="text" name="category" placeholder="Ej: Medicamentos"
                  value={form.category} onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Peso en gramos <span className="text-gray-600">(opcional)</span>
                </label>
                <input type="number" name="weight" placeholder="Ej: 400"
                  value={form.weight} onChange={handleChange}
                  min={0} step="0.1"
                  className="w-full p-3 rounded-lg bg-gray-700" />
              </div>
            </div>

            <label className="block text-sm text-gray-400 mb-1">Margen de ganancia (%)</label>
            <input type="number" name="profitMargin" placeholder="Ej: 30" value={form.profitMargin} onChange={handleChange} min={0} max={500} step="0.01" className="w-full p-3 rounded-lg bg-gray-700 mb-6" />

            <p className="text-sm font-bold text-gray-300 mb-3">Precios de compra <span className="text-gray-500 font-normal">(completá al menos uno)</span></p>

            <div className="bg-gray-700 rounded-xl p-4 mb-3">
              <p className="text-sm font-bold text-green-400 mb-2">Unidad</p>
              <input type="number" name="purchasePriceUnit" placeholder="Ej: 1248.38" value={form.purchasePriceUnit} onChange={handleChange} min={0} step="0.01" className="w-full p-3 rounded-lg bg-gray-600" />
              {previewUnit !== null && <p className="text-xs text-green-400 mt-2">Precio de venta: <strong>{formatARS(previewUnit)}</strong></p>}
            </div>

            <div className="bg-gray-700 rounded-xl p-4 mb-3">
              <p className="text-sm font-bold text-blue-400 mb-2">Tira</p>
              <input type="number" name="purchasePriceTira" placeholder="Ej: 2496.77" value={form.purchasePriceTira} onChange={handleChange} min={0} step="0.01" className="w-full p-3 rounded-lg bg-gray-600" />
              {previewTira !== null && <p className="text-xs text-blue-400 mt-2">Precio de venta: <strong>{formatARS(previewTira)}</strong></p>}
            </div>

            <div className="bg-gray-700 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-purple-400 mb-2">Caja</p>
              <input type="number" name="purchasePriceCaja" placeholder="Ej: 4993.54" value={form.purchasePriceCaja} onChange={handleChange} min={0} step="0.01" className="w-full p-3 rounded-lg bg-gray-600" />
              {previewCaja !== null && <p className="text-xs text-purple-400 mt-2">Precio de venta: <strong>{formatARS(previewCaja)}</strong></p>}
            </div>

            <label className="block text-sm text-gray-400 mb-1">Stock inicial</label>
            <input type="number" name="stock" placeholder="Ej: 50" value={form.stock} onChange={handleChange} min={0} className="w-full p-3 rounded-lg bg-gray-700 mb-6" />

            {formError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">{formError}</div>
            )}

            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold">
                {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={closeModal} disabled={loading} className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de confirmación interno */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          subMessage={confirm.subMessage}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.confirmColor}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}