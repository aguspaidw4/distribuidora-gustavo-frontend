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
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(Number(value));
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
    } catch { alert('Error al cargar los productos'); }
  }

  useEffect(() => { loadProducts(); }, []);

  function toggleProduct(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const selectedProducts = products.filter((p) => selected.has(p.id));

  async function generatePdf() {
    if (selected.size === 0) { alert('Seleccioná al menos un producto'); return; }
    setLoading(true);
    try {
      const response = await api.post('/products/price-list/pdf', { productIds: Array.from(selected) }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lista-precios.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Error al generar el PDF'); }
    finally { setLoading(false); }
  }

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 overflow-hidden">

      <h1 className="text-3xl md:text-4xl font-bold mb-1 flex-shrink-0">Lista de Precios</h1>
      <p className="text-gray-400 text-sm mb-4 flex-shrink-0">Seleccioná los productos para incluir en el PDF</p>

      {/* Layout: en mobile apilado, en desktop side by side */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* Panel selector — scrollable */}
        <div className="md:col-span-2 flex flex-col min-h-0">
          {/* Buscador y acciones — fijos */}
          <div className="flex gap-2 mb-3 flex-shrink-0">
            <div className="relative flex-1">
              <input type="text" placeholder="Buscar producto..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500 text-sm pr-8" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">✕</button>
              )}
            </div>
            <button onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium flex-shrink-0">Todos</button>
            <button onClick={() => setSelected(new Set())}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium flex-shrink-0">Limpiar</button>
          </div>

          {/* Lista scrollable */}
          <div className="bg-gray-800 rounded-2xl overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No se encontraron productos</p>
            ) : (
              <div className="divide-y divide-gray-700">
                {filtered.map((product) => {
                  const isSelected = selected.has(product.id);
                  return (
                    <div key={product.id} onClick={() => toggleProduct(product.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30' : 'hover:bg-gray-700'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <span className="font-medium truncate">{product.name}</span>
                        {product.stock === 0 && (
                          <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-400 rounded-full flex-shrink-0">Sin stock</span>
                        )}
                      </div>
                      <span className="text-green-400 font-bold text-sm flex-shrink-0 ml-2">{formatARS(product.salePrice)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel resumen — en mobile va abajo con altura fija, en desktop sticky */}
        <div className="flex-shrink-0 md:flex-shrink md:overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl p-4 md:p-6 md:sticky md:top-8">
            <h2 className="text-lg font-bold mb-3">Resumen</h2>
            <p className="text-gray-400 text-sm mb-3">
              {selected.size === 0 ? 'Ningún producto seleccionado' : `${selected.size} producto${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}`}
            </p>

            {selectedProducts.length > 0 && (
              <div className="space-y-1.5 mb-4 max-h-40 md:max-h-64 overflow-y-auto">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-sm bg-gray-700 px-3 py-2 rounded-lg">
                    <span className="truncate mr-2 text-gray-300">{p.name}</span>
                    <span className="text-green-400 font-bold flex-shrink-0">{formatARS(p.salePrice)}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={generatePdf} disabled={loading || selected.size === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold transition-colors">
              {loading ? 'Generando PDF...' : '📄 Descargar PDF'}
            </button>
            {selected.size > 0 && <p className="text-xs text-gray-500 mt-2 text-center">El PDF incluirá los precios de venta actuales</p>}
          </div>
        </div>
      </div>
    </div>
  );
}