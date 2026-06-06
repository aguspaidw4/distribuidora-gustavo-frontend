import { useEffect, useState } from 'react';
import api from '../api/axios';

type Supplier = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  purchasePrice: string;
  stock: number;
};

type PurchaseItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  updatePrice: boolean;
};

type PurchaseDetail = {
  id: number;
  productName: string;
  quantity: number;
  unitCost: string;
  subtotal: string;
  updatePrice: boolean;
};

type Purchase = {
  id: number;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  notes: string;
  createdAt: string;
  supplier: { name: string };
  details: PurchaseDetail[];
};

function formatARS(value: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
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

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [updatePrice, setUpdatePrice] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [suppRes, prodRes, purchRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products'),
        api.get('/purchases'),
      ]);
      setSuppliers(suppRes.data);
      setProducts(prodRes.data);
      setPurchases(purchRes.data);
    } catch {
      alert('Error al cargar los datos');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (p) => p.id === Number(productId),
  );

  function addItem() {
    if (!productId) {
      alert('Seleccioná un producto');
      return;
    }

    const qty = Number(quantity);
    const cost = Number(unitCost);

    if (!qty || qty <= 0) {
      alert('Ingresá una cantidad válida');
      return;
    }

    if (!cost || cost <= 0) {
      alert('Ingresá un precio de costo válido');
      return;
    }

    const product = products.find(
      (p) => p.id === Number(productId),
    );

    if (!product) return;

    // Si ya existe el producto, actualizar
    const existing = items.find(
      (i) => i.productId === product.id,
    );

    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + qty,
                unitCost: cost,
                subtotal: cost * (i.quantity + qty),
                updatePrice,
              }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitCost: cost,
          subtotal: cost * qty,
          updatePrice,
        },
      ]);
    }

    setProductId('');
    setQuantity('');
    setUnitCost('');
    setUpdatePrice(false);
  }

  function removeItem(productId: number) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);

  async function createPurchase() {
    if (!supplierId) {
      alert('Seleccioná un proveedor');
      return;
    }

    if (items.length === 0) {
      alert('Agregá productos a la compra');
      return;
    }

    const paid = Number(paidAmount) || 0;

    if (paid < 0) {
      alert('El monto pagado no puede ser negativo');
      return;
    }

    if (paid > total) {
      alert('El monto pagado no puede superar el total');
      return;
    }

    setLoading(true);

    try {
      await api.post('/purchases', {
        supplierId: Number(supplierId),
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          updatePrice: i.updatePrice,
        })),
        paidAmount: paid,
        notes: notes.trim() || undefined,
      });

      alert('Compra registrada correctamente');

      setSupplierId('');
      setItems([]);
      setPaidAmount('');
      setNotes('');

      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (typeof msg === 'string') {
        alert('Error: ' + msg);
      } else {
        alert('Error al registrar la compra');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        Compras a Distribuidoras
      </h1>

      {/* Formulario nueva compra */}
      <div className="bg-gray-800 p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-bold mb-4">
          Registrar compra
        </h2>

        {/* Proveedor */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">
            Distribuidora *
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700"
          >
            <option value="">Seleccionar distribuidora</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Agregar producto */}
        <div className="bg-gray-700 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-gray-300 mb-3">
            Agregar producto
          </p>

          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find(
                  (p) => p.id === Number(e.target.value),
                );
                if (p) setUnitCost(p.purchasePrice);
              }}
              className="p-3 rounded-lg bg-gray-600"
            >
              <option value="">Seleccionar producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — stock: {p.stock}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Cantidad"
              value={quantity}
              min={1}
              onChange={(e) => setQuantity(e.target.value)}
              className="p-3 rounded-lg bg-gray-600"
            />

            <input
              type="number"
              placeholder="Precio de costo"
              value={unitCost}
              min={0}
              step="0.01"
              onChange={(e) => setUnitCost(e.target.value)}
              className="p-3 rounded-lg bg-gray-600"
            />

            <button
              onClick={addItem}
              className="
                bg-blue-600 hover:bg-blue-700
                rounded-lg font-bold
              "
            >
              Agregar
            </button>
          </div>

          {/* Preview producto seleccionado */}
          {selectedProduct && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400">
                Precio de compra actual:{' '}
                <span className="text-white">
                  {formatARS(selectedProduct.purchasePrice)}
                </span>
              </span>

              <label className="flex items-center gap-2 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={updatePrice}
                  onChange={(e) =>
                    setUpdatePrice(e.target.checked)
                  }
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-gray-300">
                  Actualizar precio de compra y recalcular venta
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Tabla ítems */}
        <div className="bg-gray-900 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Cantidad</th>
                <th className="p-3 text-left">Costo unit.</th>
                <th className="p-3 text-left">Subtotal</th>
                <th className="p-3 text-left">Actualiza precio</th>
                <th className="p-3 text-center">Quitar</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-gray-500"
                  >
                    No hay productos en la compra todavía
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.productId}
                    className="border-b border-gray-700"
                  >
                    <td className="p-3">{item.productName}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3 text-gray-400">
                      {formatARS(item.unitCost)}
                    </td>
                    <td className="p-3 font-bold">
                      {formatARS(item.subtotal)}
                    </td>
                    <td className="p-3">
                      {item.updatePrice ? (
                        <span className="text-green-400">Sí</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="
                          bg-red-600 hover:bg-red-700
                          px-3 py-1 rounded-lg text-xs
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

        {/* Total y pago */}
        {items.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">
                Total de la compra
              </p>
              <p className="text-2xl font-bold">
                {formatARS(total)}
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Monto pagado (dejá en 0 si quedó todo en deuda)
              </label>
              <input
                type="number"
                placeholder="0"
                value={paidAmount}
                min={0}
                max={total}
                step="0.01"
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700"
              />
              {paidAmount && Number(paidAmount) < total && (
                <p className="text-sm text-yellow-400 mt-1">
                  Quedará pendiente con la distribuidora:{' '}
                  {formatARS(total - Number(paidAmount))}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">
            Notas (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: Factura B N°0001-00012345"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700"
          />
        </div>

        <button
          onClick={createPurchase}
          disabled={loading}
          className="
            bg-green-600 hover:bg-green-700
            disabled:bg-gray-600 disabled:cursor-not-allowed
            px-6 py-3 rounded-lg font-bold
          "
        >
          {loading ? 'Registrando...' : 'Registrar Compra'}
        </button>
      </div>

      {/* Historial de compras */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">
            Historial de compras
          </h2>
        </div>

        {purchases.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No hay compras registradas todavía
          </p>
        ) : (
          <div className="divide-y divide-gray-700">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">
                      Compra #{purchase.id} —{' '}
                      {purchase.supplier?.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(purchase.createdAt)}
                    </p>
                    {purchase.notes && (
                      <p className="text-gray-500 text-sm mt-1">
                        {purchase.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1 text-sm">
                    <p className="text-gray-400">
                      Total:{' '}
                      <span className="text-white font-bold">
                        {formatARS(purchase.total)}
                      </span>
                    </p>
                    <p className="text-gray-400">
                      Pagado:{' '}
                      <span className="text-green-400">
                        {formatARS(purchase.paidAmount)}
                      </span>
                    </p>
                    {Number(purchase.pendingAmount) > 0 && (
                      <p className="text-red-400 font-bold">
                        Pendiente con distribuidora:{' '}
                        {formatARS(purchase.pendingAmount)}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedId(
                      expandedId === purchase.id
                        ? null
                        : purchase.id,
                    )
                  }
                  className="
                    mt-3
                    bg-gray-700 hover:bg-gray-600
                    px-4 py-1.5 rounded-lg text-sm
                  "
                >
                  {expandedId === purchase.id
                    ? 'Ocultar detalle'
                    : 'Ver detalle'}
                </button>

                {expandedId === purchase.id && (
                  <div className="mt-4 bg-gray-700 rounded-xl p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-600">
                          <th className="text-left pb-2">Producto</th>
                          <th className="text-left pb-2">Cantidad</th>
                          <th className="text-left pb-2">Costo unit.</th>
                          <th className="text-left pb-2">Subtotal</th>
                          <th className="text-left pb-2">Precio actualizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchase.details.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-gray-600 last:border-0"
                          >
                            <td className="py-2">{d.productName}</td>
                            <td className="py-2">{d.quantity}</td>
                            <td className="py-2 text-gray-400">
                              {formatARS(d.unitCost)}
                            </td>
                            <td className="py-2 font-bold">
                              {formatARS(d.subtotal)}
                            </td>
                            <td className="py-2">
                              {d.updatePrice ? (
                                <span className="text-green-400">Sí</span>
                              ) : (
                                <span className="text-gray-500">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}