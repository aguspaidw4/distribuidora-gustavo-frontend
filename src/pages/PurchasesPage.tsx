import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProductSearchSelect from '../components/ProductSearchSelect';
import ConfirmModal from '../components/ConfirmModal';

type Customer = { id: number; name: string };
type Product = {
  id: number; name: string; stock: number;
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

export default function OrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [presentation, setPresentation] = useState<Presentation>('UNIDAD');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [customersRes, productsRes] = await Promise.all([
      api.get('/customers'), api.get('/products'),
    ]);
    setCustomers(customersRes.data);
    setProducts(productsRes.data);
  }

  const selectedProduct = products.find((p) => p.id === Number(productId));

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

  function handleProductChange(id: string) {
    setProductId(id);
    setQuantity('');
    const product = products.find((p) => p.id === Number(id));
    if (product) setPresentation(availablePresentations(product)[0]);
  }

  const unitPrice = selectedProduct ? getPriceForPresentation(selectedProduct, presentation) : 0;

  function addItem() {
    if (!selectedProduct) { setConfirm({ message: 'Seleccioná un producto', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) }); return; }
    const qty = Number(quantity);
    if (!qty || qty <= 0) { setConfirm({ message: 'Ingresá una cantidad válida', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) }); return; }

    const existingItem = items.find((i) => i.productId === selectedProduct.id && i.presentation === presentation);
    const alreadyInCart = existingItem ? existingItem.quantity : 0;
    const totalRequested = alreadyInCart + qty;

    if (totalRequested > selectedProduct.stock) {
      setConfirm({
        message: `Stock insuficiente para "${selectedProduct.name}"`,
        subMessage: `Disponible: ${selectedProduct.stock}${alreadyInCart > 0 ? ` (ya tenés ${alreadyInCart} en el carrito)` : ''}`,
        confirmLabel: 'Aceptar',
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
        onConfirm: () => setConfirm(null),
      });
      return;
    }

    if (existingItem) {
      setItems(items.map((i) =>
        i.productId === selectedProduct.id && i.presentation === presentation
          ? { ...i, quantity: i.quantity + qty, subtotal: i.unitPrice * (i.quantity + qty) }
          : i,
      ));
    } else {
      setItems([...items, {
        productId: selectedProduct.id, name: selectedProduct.name,
        presentation, quantity: qty, unitPrice, subtotal: unitPrice * qty,
        availableStock: selectedProduct.stock,
      }]);
    }
    setProductId('');
    setQuantity('');
  }

  function removeItem(productId: number, presentation: Presentation) {
    setItems(items.filter((i) => !(i.productId === productId && i.presentation === presentation)));
  }

  async function createOrder() {
    if (!customerId) { setConfirm({ message: 'Seleccioná un cliente', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) }); return; }
    if (items.length === 0) { setConfirm({ message: 'Agregá productos al pedido', confirmLabel: 'Aceptar', confirmColor: 'bg-blue-600 hover:bg-blue-700', onConfirm: () => setConfirm(null) }); return; }

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
        message: '¡Pedido creado correctamente!',
        confirmLabel: 'Aceptar',
        confirmColor: 'bg-green-600 hover:bg-green-700',
        onConfirm: () => setConfirm(null),
      });
      setCustomerId('');
      setItems([]);
      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setConfirm({
        message: Array.isArray(msg) ? msg.join('\n') : typeof msg === 'string' ? msg : 'Ocurrió un error al crear el pedido',
        confirmLabel: 'Aceptar',
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
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

      {/* Formulario */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-2xl mb-6">

        {/* Cliente */}
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Cliente *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700">
            <option value="">Seleccionar Cliente</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Producto */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm text-gray-400">Producto</label>
            <button
              type="button"
              onClick={async () => {
                const res = await api.get('/products');
                setProducts(res.data);
              }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              ↻ Actualizar lista
            </button>
          </div>
          <ProductSearchSelect
            options={products.filter((p) => p.stock > 0).map((p) => ({ id: p.id, label: p.name, sublabel: `stock: ${p.stock}` }))}
            value={productId}
            onChange={handleProductChange}
            placeholder="Seleccionar Producto"
          />
        </div>

        {/* Presentación + Cantidad en grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Presentación</label>
            <select value={presentation} onChange={(e) => setPresentation(e.target.value as Presentation)}
              className="w-full p-3 rounded-lg bg-gray-700" disabled={!selectedProduct}>
              {selectedProduct
                ? availablePresentations(selectedProduct).map((pres) => (
                    <option key={pres} value={pres}>
                      {PRESENTATION_LABELS[pres]} — {formatARS(getPriceForPresentation(selectedProduct, pres))}
                    </option>
                  ))
                : <option value="UNIDAD">Unidad</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
            <input type="number" placeholder="Ej: 2" value={quantity} min={1}
              max={selectedProduct?.stock ?? undefined}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700" />
          </div>
        </div>

        {/* Info producto */}
        {selectedProduct && (
          <div className="text-sm text-gray-400 mb-3 p-3 bg-gray-700 rounded-lg">
            <span className="text-white font-bold">{selectedProduct.name}</span>
            {' — '}Stock: <span className={selectedProduct.stock <= 5 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{selectedProduct.stock}</span>
            {' — '}Precio: <span className="text-white font-bold">{formatARS(unitPrice)}</span>
          </div>
        )}

        <button onClick={addItem} className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg font-bold p-3">
          + Agregar al pedido
        </button>
      </div>

      {/* Items del pedido */}
      {items.length > 0 && (
        <div className="mb-6">
          {/* Desktop — tabla */}
          <div className="hidden md:block bg-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-4 text-left">Producto</th>
                  <th className="p-4 text-left">Presentación</th>
                  <th className="p-4 text-left">Cant.</th>
                  <th className="p-4 text-left">Precio unit.</th>
                  <th className="p-4 text-left">Subtotal</th>
                  <th className="p-4 text-center">Quitar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={`${item.productId}-${item.presentation}`} className="border-b border-gray-700">
                    <td className="p-4">{item.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.presentation === 'TIRA' ? 'bg-blue-900 text-blue-300' : item.presentation === 'CAJA' ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                        {PRESENTATION_LABELS[item.presentation]}
                      </span>
                    </td>
                    <td className="p-4">{item.quantity}</td>
                    <td className="p-4">{formatARS(item.unitPrice)}</td>
                    <td className="p-4 font-bold">{formatARS(item.subtotal)}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => removeItem(item.productId, item.presentation)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm">Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — tarjetas */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.presentation}`} className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold mt-1 inline-block ${item.presentation === 'TIRA' ? 'bg-blue-900 text-blue-300' : item.presentation === 'CAJA' ? 'bg-purple-900 text-purple-300' : 'bg-gray-700 text-gray-300'}`}>
                      {PRESENTATION_LABELS[item.presentation]}
                    </span>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.presentation)} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-xs">Quitar</button>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Cant: <span className="text-white font-bold">{item.quantity}</span></span>
                  <span>Unit: <span className="text-white">{formatARS(item.unitPrice)}</span></span>
                  <span>Sub: <span className="text-green-400 font-bold">{formatARS(item.subtotal)}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="bg-gray-800 rounded-2xl p-8 text-center text-gray-500 mb-6">
          No hay productos en el pedido todavía
        </div>
      )}

      {/* Total y botón */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl md:text-3xl font-bold text-white">{formatARS(total)}</p>
        </div>
        <button onClick={createOrder} disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold">
          {loading ? 'Creando...' : 'Crear Pedido'}
        </button>
      </div>

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