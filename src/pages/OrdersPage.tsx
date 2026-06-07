import { useEffect, useState } from 'react';
import api from '../api/axios';

type Customer = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  stock: number;
  salePriceUnit: string | null;
  salePriceTira: string | null;
  salePriceCaja: string | null;
};

type Presentation = 'UNIDAD' | 'TIRA' | 'CAJA';

type OrderItem = {
  productId: number;
  name: string;
  presentation: Presentation;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableStock: number;
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

const PRESENTATION_LABELS: Record<Presentation, string> = {
  UNIDAD: 'Unidad',
  TIRA: 'Tira',
  CAJA: 'Caja',
};

export default function OrdersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [presentation, setPresentation] = useState<Presentation>('UNIDAD');
  const [quantity, setQuantity] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [customersRes, productsRes] = await Promise.all([
      api.get('/customers'),
      api.get('/products'),
    ]);
    setCustomers(customersRes.data);
    setProducts(productsRes.data);
  }

  const selectedProduct = products.find(
    (p) => p.id === Number(productId),
  );

  // Presentaciones disponibles para el producto seleccionado
  function availablePresentations(product: Product): Presentation[] {
    const pres: Presentation[] = [];
    if (product.salePriceUnit) pres.push('UNIDAD');
    if (product.salePriceTira) pres.push('TIRA');
    if (product.salePriceCaja) pres.push('CAJA');
    return pres.length > 0 ? pres : ['UNIDAD'];
  }

  // Precio de la presentación seleccionada
  function getPriceForPresentation(product: Product, pres: Presentation): number {
    if (pres === 'TIRA' && product.salePriceTira) return Number(product.salePriceTira);
    if (pres === 'CAJA' && product.salePriceCaja) return Number(product.salePriceCaja);
    return Number(product.salePriceUnit ?? product.salePriceTira ?? product.salePriceCaja ?? 0);
  }

  // Al cambiar producto, resetear presentación a la primera disponible
  function handleProductChange(id: string) {
    setProductId(id);
    setQuantity('');
    const product = products.find((p) => p.id === Number(id));
    if (product) {
      const available = availablePresentations(product);
      setPresentation(available[0]);
    }
  }

  const unitPrice = selectedProduct
    ? getPriceForPresentation(selectedProduct, presentation)
    : 0;

  function addItem() {
    if (!selectedProduct) {
      alert('Seleccioná un producto');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      alert('Ingresá una cantidad válida');
      return;
    }


    const existingItem = items.find(
      (i) => i.productId === selectedProduct.id && i.presentation === presentation,
    );
    const alreadyInCart = existingItem ? existingItem.quantity : 0;
    const totalRequested = alreadyInCart + qty;

    if (totalRequested > selectedProduct.stock) {
      alert(
        `Stock insuficiente para "${selectedProduct.name}".\n` +
        `Disponible: ${selectedProduct.stock}` +
        (alreadyInCart > 0 ? ` (ya tenés ${alreadyInCart} en el carrito)` : ''),
      );
      return;
    }

    if (existingItem) {
      setItems(items.map((i) =>
        i.productId === selectedProduct.id && i.presentation === presentation
          ? { ...i, quantity: i.quantity + qty, subtotal: i.unitPrice * (i.quantity + qty) }
          : i,
      ));
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          presentation,
          quantity: qty,
          unitPrice,
          subtotal: unitPrice * qty,
          availableStock: selectedProduct.stock,
        },
      ]);
    }

    setProductId('');
    setQuantity('');
  }

  function removeItem(productId: number, presentation: Presentation) {
    setItems(items.filter(
      (i) => !(i.productId === productId && i.presentation === presentation),
    ));
  }

  async function createOrder() {
    if (!customerId) { alert('Seleccioná un cliente'); return; }
    if (items.length === 0) { alert('Agregá productos al pedido'); return; }

    setLoading(true);
    try {
      await api.post('/orders', {
        customerId: Number(customerId),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          presentation: item.presentation,
          unitPrice: item.unitPrice,
        })),
      });

      alert('Pedido creado correctamente');
      setCustomerId('');
      setItems([]);

      const productsRes = await api.get('/products');
      setProducts(productsRes.data);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        alert('Error: ' + msg.join('\n'));
      } else if (typeof msg === 'string') {
        alert('Error: ' + msg);
      } else {
        alert('Ocurrió un error al crear el pedido');
      }
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Nuevo Pedido</h1>

      {/* Formulario */}
      <div className="bg-gray-800 p-6 rounded-2xl mb-8">
        <div className="grid md:grid-cols-5 gap-4">

          {/* Cliente */}
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="p-3 rounded-lg bg-gray-700"
          >
            <option value="">Seleccionar Cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Producto */}
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="p-3 rounded-lg bg-gray-700"
          >
            <option value="">Seleccionar Producto</option>
            {products
              .filter((p) => p.stock > 0)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — stock: {p.stock}
                </option>
              ))}
          </select>

          {/* Presentación */}
          <select
            value={presentation}
            onChange={(e) => setPresentation(e.target.value as Presentation)}
            className="p-3 rounded-lg bg-gray-700"
            disabled={!selectedProduct}
          >
            {selectedProduct
              ? availablePresentations(selectedProduct).map((pres) => (
                  <option key={pres} value={pres}>
                    {PRESENTATION_LABELS[pres]} — {formatARS(getPriceForPresentation(selectedProduct, pres))}
                  </option>
                ))
              : <option value="UNIDAD">Unidad</option>}
          </select>

          {/* Cantidad */}
          <input
            type="number"
            placeholder="Cantidad"
            value={quantity}
            min={1}
            max={selectedProduct?.stock ?? undefined}
            onChange={(e) => setQuantity(e.target.value)}
            className="p-3 rounded-lg bg-gray-700"
          />

          <button
            onClick={addItem}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
          >
            Agregar
          </button>
        </div>

        {/* Info producto seleccionado */}
        {selectedProduct && (
          <div className="mt-3 text-sm text-gray-400">
            <span className="text-white font-bold">{selectedProduct.name}</span>
            {' — '}Stock:{' '}
            <span className={selectedProduct.stock <= 5 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
              {selectedProduct.stock} unidades
            </span>
            {' — '}Precio {PRESENTATION_LABELS[presentation]}:{' '}
            <span className="text-white font-bold">{formatARS(unitPrice)}</span>
          </div>
        )}
      </div>

      {/* Tabla ítems */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Producto</th>
              <th className="p-4 text-left">Presentación</th>
              <th className="p-4 text-left">Cantidad</th>
              <th className="p-4 text-left">Precio unit.</th>
              <th className="p-4 text-left">Subtotal</th>
              <th className="p-4 text-center">Quitar</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No hay productos en el pedido todavía
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={`${item.productId}-${item.presentation}`}
                  className="border-b border-gray-700"
                >
                  <td className="p-4">{item.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.presentation === 'TIRA'
                        ? 'bg-blue-900 text-blue-300'
                        : item.presentation === 'CAJA'
                        ? 'bg-purple-900 text-purple-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {PRESENTATION_LABELS[item.presentation]}
                    </span>
                  </td>
                  <td className="p-4">{item.quantity}</td>
                  <td className="p-4">{formatARS(item.unitPrice)}</td>
                  <td className="p-4">{formatARS(item.subtotal)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => removeItem(item.productId, item.presentation)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm"
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
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-bold"
        >
          {loading ? 'Creando pedido...' : 'Crear Pedido'}
        </button>
      </div>
    </div>
  );
}