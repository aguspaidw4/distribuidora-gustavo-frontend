import { useEffect, useState } from 'react';
import api from '../api/axios';

type Product = {
  id: number;
  name: string;
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

export default function PriceListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  async function loadProducts() {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch {
      alert('Error al cargar los productos');
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function toggleProduct(id: number) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(filtered.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedProducts = products.filter((p) =>
    selected.has(p.id),
  );

  async function generatePdf() {
    if (selected.size === 0) {
      alert('Seleccioná al menos un producto');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        '/products/price-list/pdf',
        { productIds: Array.from(selected) },
        { responseType: 'blob' },
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data]),
      );

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lista-precios.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el PDF');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold mb-2">
        Lista de Precios
      </h1>
      <p className="text-gray-400 mb-8">
        Seleccioná los productos para incluir en el PDF
      </p>

      <div className="grid md:grid-cols-3 gap-8">

        {/* Panel izquierdo — selector */}
        <div className="md:col-span-2">

          {/* Buscador y acciones */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                flex-1 p-3
                rounded-lg bg-gray-800
                border border-gray-700
                focus:outline-none focus:border-blue-500
              "
            />
            <button
              onClick={selectAll}
              className="
                px-4 py-2 rounded-lg
                bg-gray-700 hover:bg-gray-600
                text-sm font-medium
              "
            >
              Todos
            </button>
            <button
              onClick={clearAll}
              className="
                px-4 py-2 rounded-lg
                bg-gray-700 hover:bg-gray-600
                text-sm font-medium
              "
            >
              Limpiar
            </button>
          </div>

          {/* Lista de productos */}
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-gray-500">
                No se encontraron productos
              </p>
            ) : (
              <div className="divide-y divide-gray-700">
                {filtered.map((product) => {
                  const isSelected = selected.has(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`
                        flex items-center justify-between
                        p-4 cursor-pointer transition-colors
                        ${isSelected
                          ? 'bg-blue-900/30'
                          : 'hover:bg-gray-700'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                            w-5 h-5 rounded
                            border-2 flex items-center justify-center
                            flex-shrink-0
                            ${isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-500'}
                          `}
                        >
                          {isSelected && (
                            <span className="text-white text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <span className="font-medium">
                          {product.name}
                        </span>

                        {product.stock <= 5 && (
                          <span className="
                            text-xs px-2 py-0.5
                            bg-red-900/50 text-red-400
                            rounded-full
                          ">
                            Stock bajo
                          </span>
                        )}
                      </div>

                      <span className="text-green-400 font-bold">
                        {formatARS(product.salePrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho — resumen y descarga */}
        <div>
          <div className="bg-gray-800 rounded-2xl p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">
              Resumen
            </h2>

            <p className="text-gray-400 text-sm mb-4">
              {selected.size === 0
                ? 'Ningún producto seleccionado'
                : `${selected.size} producto${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}`}
            </p>

            {/* Lista de seleccionados */}
            {selectedProducts.length > 0 && (
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="
                      flex justify-between items-center
                      text-sm bg-gray-700
                      px-3 py-2 rounded-lg
                    "
                  >
                    <span className="truncate mr-2 text-gray-300">
                      {p.name}
                    </span>
                    <span className="text-green-400 font-bold flex-shrink-0">
                      {formatARS(p.salePrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={generatePdf}
              disabled={loading || selected.size === 0}
              className="
                w-full
                bg-green-600 hover:bg-green-700
                disabled:bg-gray-600 disabled:cursor-not-allowed
                p-3 rounded-lg font-bold
                transition-colors
              "
            >
              {loading
                ? 'Generando PDF...'
                : '📄 Descargar PDF'}
            </button>

            {selected.size > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                El PDF incluirá los precios de venta actuales
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}