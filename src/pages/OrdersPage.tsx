import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

type Customer = { id: number; name: string };
type Product = {
  id: number; name: string; stock: number;
  profitMargin: number;
  purchasePriceUnit: number | null;
  purchasePriceTira: number | null;
  purchasePriceCaja: number | null;
  salePriceUnit: string | null;
  salePriceTira: string | null;
  salePriceCaja: string | null;
};
type Presentation = 'UNIDAD' | 'TIRA' | 'CAJA';
type OrderItem = {
  productId: number; name: string; presentation: Presentation;
  quantity: number; unitPrice: number; subtotal: number; availableStock: number;
};
type ConfirmState = {
  message: string; subMessage?: string; confirmLabel?: string;
  confirmColor?: string; onConfirm: () => void;
} | null;

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(Number(value));
}

const PRESENTATION_LABELS: Record<Presentation, string> = { UNIDAD: 'Unidad', TIRA: 'Tira', CAJA: 'Caja' };
const PRES_BADGE: Record<Presentation, string> = {
  UNIDAD: 'bg-gray-700 text-gray-300',
  TIRA: 'bg-blue-900 text-blue-300',
  CAJA: 'bg-purple-900 text-purple-300',
};

export default function OrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  // Busqueda y seleccion masiva
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingPres, setPendingPres] = useState<Record<number, Presentation>>({});

  // Modal actualizacion de precio
  const [priceEditProduct, setPriceEditProduct] = useState<Product | null>(null);
  const [priceEditUnit, setPriceEditUnit] = useState('');
  const [priceEditTira, setPriceEditTira] = useState('');
  const [priceEditCaja, setPriceEditCaja] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceEditError, setPriceEditError] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [customersRes, productsRes] = await Promise.all([
      api.get('/customers'), api.get('/products'),
    ]);
    setCustomers(customersRes.data);
    setProducts(productsRes.data);
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => p.stock > 0)
      .filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  function availablePresentations(product: Product): Presentation[] {
    const pres: Presentation[] = [];
    if (product.salePriceUnit) pres.push('UNIDAD');
    if (product.salePriceTira) pres.push('TIRA');
    if (product.salePriceCaja) pres.push('CAJA');
    return pres.length > 0 ? pres : ['UNIDAD'];
  }

  function getPriceForPresentation(product: Product, pres: Presentation): number {
    if (pres === 'TIRA' && product.salePriceTira) return Number(product.salePriceTira);
    if (pres === 'CAJA' && product.salePriceCaja) return Number(product.salePriceCaja);
    return Number(product.salePriceUnit ?? product.salePriceTira ?? product.salePriceCaja ?? 0);
  }

  function getPresForProduct(product: Product): Presentation {
    return pendingPres[product.id] ?? availablePresentations(product)[0];
  }

  function toggleProduct(product: Product) {
    const next = new Set(selectedIds);
    if (next.has(product.id)) {
      next.delete(product.id);
    } else {
      next.add(product.id);
      if (!pendingPres[product.id]) {
        setPendingPres((prev) => ({ ...prev, [product.id]: availablePresentations(product)[0] }));
      }
    }
    setSelectedIds(next);
  }

  function toggleAll() {
    if (filteredProducts.every((p) => selectedIds.has(p.id))) {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => {
        next.add(p.id);
        if (!pendingPres[p.id]) {
          setPendingPres((prev) => ({ ...prev, [p.id]: availablePresentations(p)[0] }));
        }
      });
      setSelectedIds(next);
    }
  }

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  function addSelectedToOrder() {
    if (selectedIds.size === 0) {
      setConfirm({ message: 'Selecciona al menos un producto', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) });
      return;
    }
    const toAdd: OrderItem[] = [];
    for (const id of selectedIds) {
      const product = products.find((p) => p.id === id);
      if (!product) continue;
      const pres = getPresForProduct(product);
      const price = getPriceForPresentation(product, pres);
      toAdd.push({
        productId: product.id, name: product.name, presentation: pres,
        quantity: 1, unitPrice: price, subtotal: price, availableStock: product.stock,
      });
    }
    const merged = [...items];
    for (const newItem of toAdd) {
      const existing = merged.findIndex(
        (i) => i.productId === newItem.productId && i.presentation === newItem.presentation,
      );
      if (existing < 0) merged.push(newItem);
    }
    setItems(merged);
    setSelectedIds(new Set());
    setSearch('');
    setPendingPres({});
  }

  function updateItemQuantity(productId: number, pres: Presentation, qty: number) {
    if (qty <= 0) return;
    setItems(items.map((i) =>
      i.productId === productId && i.presentation === pres
        ? { ...i, quantity: qty, subtotal: i.unitPrice * qty }
        : i,
    ));
  }

  function updateItemPresentation(item: OrderItem, newPres: Presentation) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    const newPrice = getPriceForPresentation(product, newPres);
    setItems(items.map((i) =>
      i.productId === item.productId && i.presentation === item.presentation
        ? { ...i, presentation: newPres, unitPrice: newPrice, subtotal: newPrice * i.quantity }
        : i,
    ));
  }

  function removeItem(productId: number, presentation: Presentation) {
    setItems(items.filter((i) => !(i.productId === productId && i.presentation === presentation)));
  }

  // Abrir modal de precio
  function openPriceEdit(e: React.MouseEvent, product: Product) {
    e.stopPropagation();
    setPriceEditProduct(product);
    setPriceEditUnit(product.purchasePriceUnit != null ? String(product.purchasePriceUnit) : '');
    setPriceEditTira(product.purchasePriceTira != null ? String(product.purchasePriceTira) : '');
    setPriceEditCaja(product.purchasePriceCaja != null ? String(product.purchasePriceCaja) : '');
    setPriceEditError('');
  }

  // Calcular precio de venta preview
  function calcSalePreview(purchaseStr: string, margin: number): string {
    const p = Number(purchaseStr);
    if (!p || p <= 0) return '—';
    return formatARS(p * (1 + margin / 100));
  }

  async function savePriceEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!priceEditProduct) return;
    setPriceEditError('');

    const hasAtLeastOne = priceEditUnit || priceEditTira || priceEditCaja;
    if (!hasAtLeastOne) {
      setPriceEditError('Ingresa al menos un precio');
      return;
    }

    const body: Record<string, number | null> = {
      purchasePriceUnit: priceEditUnit ? Number(priceEditUnit) : null,
      purchasePriceTira: priceEditTira ? Number(priceEditTira) : null,
      purchasePriceCaja: priceEditCaja ? Number(priceEditCaja) : null,
    };

    // Validar que los precios ingresados sean > 0
    for (const [key, val] of Object.entries(body)) {
      if (val !== null && val <= 0) {
        setPriceEditError(`El precio de ${key.replace('purchasePrice', '')} debe ser mayor a 0`);
        return;
      }
    }

    setSavingPrice(true);
    try {
      await api.patch(`/products/${priceEditProduct.id}`, body);
      // Recargar productos para reflejar los nuevos precios
      const res = await api.get('/products');
      setProducts(res.data);
      setPriceEditProduct(null);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setPriceEditError(typeof msg === 'string' ? msg : 'Error al actualizar el precio');
    } finally {
      setSavingPrice(false);
    }
  }

  async function createOrder() {
    if (!customerId) {
      setConfirm({ message: 'Selecciona un cliente', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) });
      return;
    }
    if (items.length === 0) {
      setConfirm({ message: 'Agrega productos al pedido', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) });
      return;
    }
    for (const item of items) {
      if (item.quantity > item.availableStock) {
        setConfirm({
          message: `Stock insuficiente para "${item.name}"`,
          subMessage: `Disponible: ${item.availableStock}, pedido: ${item.quantity}`,
          confirmLabel: 'Aceptar', confirmColor: 'bg-red-600 hover:bg-red-700',
          onConfirm: () => setConfirm(null),
        });
        return;
      }
    }
    setLoading(true);
    try {
      await api.post('/orders', {
        customerId: Number(customerId),
        items: items.map((item) => ({
          productId: item.productId, quantity: item.quantity,
          presentation: item.presentation, unitPrice: item.unitPrice,
        })),
      });
      setConfirm({
        message: 'Pedido creado correctamente!',
        confirmLabel: 'Aceptar', confirmColor: 'bg-green-600 hover:bg-green-700',
        onConfirm: () => setConfirm(null),
      });
      setCustomerId('');
      setItems([]);
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setConfirm({
        message: Array.isArray(msg) ? msg.join('\n') : typeof msg === 'string' ? msg : 'Ocurrio un error al crear el pedido',
        confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700',
        onConfirm: () => setConfirm(null),
      });
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Nuevo Pedido</h1>

      {/* Cliente */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-2xl mb-4">
        <label className="block text-sm text-gray-400 mb-1">Cliente *</label>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700">
          <option value="">Seleccionar Cliente</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Selector de productos por checkbox */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-2xl mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
          <h2 className="text-lg font-bold">
            Seleccionar productos
            {selectedIds.size > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-400">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={async () => { const res = await api.get('/products'); setProducts(res.data); }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Actualizar lista
          </button>
        </div>

        {/* Buscador */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 pr-8 rounded-lg bg-gray-700 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">x</button>
          )}
        </div>

        {/* Lista con checkbox */}
        <div className="border border-gray-700 rounded-xl overflow-hidden mb-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-700 border-b border-gray-600">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">
              {allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
              {filteredProducts.length > 0 && ` (${filteredProducts.length})`}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-700">
            {filteredProducts.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">
                {search ? 'Sin resultados para esa busqueda' : 'No hay productos con stock disponible'}
              </p>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const pres = getPresForProduct(product);
                const price = getPriceForPresentation(product, pres);
                const availPres = availablePresentations(product);

                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30' : 'hover:bg-gray-700/50'}`}
                    onClick={() => toggleProduct(product)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(product)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">
                        Stock: <span className={product.stock <= 5 ? 'text-red-400 font-bold' : 'text-green-400'}>{product.stock}</span>
                        {' — '}{formatARS(price)}
                      </p>
                    </div>

                    {/* Boton actualizar precio */}
                    <button
                      onClick={(e) => openPriceEdit(e, product)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex-shrink-0 px-2 py-1 rounded hover:bg-yellow-900/30 transition-colors"
                      title="Actualizar precio de compra"
                    >
                      $ Precio
                    </button>

                    {isSelected && availPres.length > 1 && (
                      <select
                        value={pres}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newPres = e.target.value as Presentation;
                          setPendingPres((prev) => ({ ...prev, [product.id]: newPres }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-gray-600 rounded-lg px-2 py-1.5 border border-gray-500 flex-shrink-0"
                      >
                        {availPres.map((p) => (
                          <option key={p} value={p}>
                            {PRESENTATION_LABELS[p]} — {formatARS(getPriceForPresentation(product, p))}
                          </option>
                        ))}
                      </select>
                    )}

                    {isSelected && availPres.length === 1 && (
                      <span className={`text-xs px-2 py-1 rounded font-bold flex-shrink-0 ${PRES_BADGE[availPres[0]]}`}>
                        {PRESENTATION_LABELS[availPres[0]]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button
          onClick={addSelectedToOrder}
          disabled={selectedIds.size === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-xl font-bold transition-colors"
        >
          {selectedIds.size === 0
            ? 'Selecciona productos para agregar'
            : `+ Agregar ${selectedIds.size} producto${selectedIds.size !== 1 ? 's' : ''} al pedido`}
        </button>
      </div>

      {/* Lista del pedido */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">
            Pedido
            {items.length > 0 && <span className="ml-2 text-sm font-normal text-gray-400">{items.length} producto{items.length !== 1 ? 's' : ''}</span>}
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => setConfirm({
                message: 'Vaciar el pedido?',
                subMessage: 'Se quitaran todos los productos',
                confirmLabel: 'Vaciar', confirmColor: 'bg-red-600 hover:bg-red-700',
                onConfirm: () => { setItems([]); setConfirm(null); },
              })}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Vaciar todo
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No hay productos en el pedido todavia</p>
        ) : (
          <div className="divide-y divide-gray-700">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const availPres = product ? availablePresentations(product) : [item.presentation];

              return (
                <div key={`${item.productId}-${item.presentation}`} className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <p className="font-bold text-white text-sm flex-1">{item.name}</p>
                    <button
                      onClick={() => removeItem(item.productId, item.presentation)}
                      className="text-red-400 hover:text-red-300 text-xs flex-shrink-0"
                    >
                      x Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Presentacion</label>
                      {availPres.length > 1 ? (
                        <select
                          value={item.presentation}
                          onChange={(e) => updateItemPresentation(item, e.target.value as Presentation)}
                          className="w-full p-2 rounded-lg bg-gray-700 text-sm"
                        >
                          {availPres.map((p) => (
                            <option key={p} value={p}>
                              {PRESENTATION_LABELS[p]} — {product ? formatARS(getPriceForPresentation(product, p)) : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block px-2 py-2 rounded text-xs font-bold ${PRES_BADGE[item.presentation]}`}>
                          {PRESENTATION_LABELS[item.presentation]}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Cantidad <span className="text-gray-500">(max. {item.availableStock})</span>
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        min={1}
                        max={item.availableStock}
                        onChange={(e) => updateItemQuantity(item.productId, item.presentation, Number(e.target.value))}
                        className={`w-full p-2 rounded-lg text-sm ${item.quantity > item.availableStock ? 'bg-red-900/50 border border-red-500' : 'bg-gray-700'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Precio unit.</label>
                      <p className="p-2 text-sm font-bold text-white">{formatARS(item.unitPrice)}</p>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Subtotal</label>
                      <p className={`p-2 text-sm font-bold ${item.quantity > item.availableStock ? 'text-red-400' : 'text-green-400'}`}>
                        {formatARS(item.subtotal)}
                      </p>
                    </div>
                  </div>

                  {item.quantity > item.availableStock && (
                    <p className="text-xs text-red-400 mt-1">
                      Stock insuficiente — disponible: {item.availableStock}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Total y boton crear */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{formatARS(total)}</p>
        </div>
        <button
          onClick={createOrder}
          disabled={loading || items.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold"
        >
          {loading ? 'Creando...' : 'Crear Pedido'}
        </button>
      </div>

      {/* Modal actualizacion de precio */}
      {priceEditProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form onSubmit={savePriceEdit} className="bg-gray-800 p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-1">Actualizar precio de compra</h2>
            <p className="text-gray-400 text-sm mb-5 truncate">{priceEditProduct.name}</p>

            <p className="text-xs text-gray-500 mb-4">
              Margen de ganancia actual: <span className="text-white font-bold">{Number(priceEditProduct.profitMargin)}%</span>
              {' '}— los precios de venta se recalculan automaticamente.
            </p>

            {/* Unidad */}
            {priceEditProduct.purchasePriceUnit != null && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Precio de compra — <span className="text-gray-300">Unidad</span>
                  <span className="ml-2 text-xs text-gray-500">actual: {formatARS(priceEditProduct.purchasePriceUnit)}</span>
                </label>
                <input
                  type="number" min={0} step="0.01"
                  value={priceEditUnit}
                  onChange={(e) => { setPriceEditUnit(e.target.value); setPriceEditError(''); }}
                  className="w-full p-3 rounded-lg bg-gray-700"
                  placeholder="Nuevo precio de compra"
                />
                {priceEditUnit && Number(priceEditUnit) > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    Precio de venta: {calcSalePreview(priceEditUnit, Number(priceEditProduct.profitMargin))}
                  </p>
                )}
              </div>
            )}

            {/* Tira */}
            {priceEditProduct.purchasePriceTira != null && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Precio de compra — <span className="text-blue-300">Tira</span>
                  <span className="ml-2 text-xs text-gray-500">actual: {formatARS(priceEditProduct.purchasePriceTira)}</span>
                </label>
                <input
                  type="number" min={0} step="0.01"
                  value={priceEditTira}
                  onChange={(e) => { setPriceEditTira(e.target.value); setPriceEditError(''); }}
                  className="w-full p-3 rounded-lg bg-gray-700"
                  placeholder="Nuevo precio de compra"
                />
                {priceEditTira && Number(priceEditTira) > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    Precio de venta: {calcSalePreview(priceEditTira, Number(priceEditProduct.profitMargin))}
                  </p>
                )}
              </div>
            )}

            {/* Caja */}
            {priceEditProduct.purchasePriceCaja != null && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Precio de compra — <span className="text-purple-300">Caja</span>
                  <span className="ml-2 text-xs text-gray-500">actual: {formatARS(priceEditProduct.purchasePriceCaja)}</span>
                </label>
                <input
                  type="number" min={0} step="0.01"
                  value={priceEditCaja}
                  onChange={(e) => { setPriceEditCaja(e.target.value); setPriceEditError(''); }}
                  className="w-full p-3 rounded-lg bg-gray-700"
                  placeholder="Nuevo precio de compra"
                />
                {priceEditCaja && Number(priceEditCaja) > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    Precio de venta: {calcSalePreview(priceEditCaja, Number(priceEditProduct.profitMargin))}
                  </p>
                )}
              </div>
            )}

            {priceEditError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
                {priceEditError}
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={savingPrice}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold">
                {savingPrice ? 'Guardando...' : 'Actualizar precio'}
              </button>
              <button type="button" onClick={() => setPriceEditProduct(null)} disabled={savingPrice}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

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