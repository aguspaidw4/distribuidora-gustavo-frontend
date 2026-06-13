import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

type Supplier = {
  id: number;
  name: string;
  cuit: string | null;
  address: string | null;
  phone: string | null;
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
  supplier: { id: number; name: string };
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

function normalizeCuit(value: string): string {
  return value.replace(/[-\s]/g, '');
}

function validateCuit(cuit: string): string | null {
  const normalized = normalizeCuit(cuit);
  if (!/^\d+$/.test(normalized)) return 'El CUIT debe contener solo números';
  if (normalized.length !== 11) return 'El CUIT debe tener exactamente 11 dígitos';
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = normalized.split('').map(Number);
  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
  const remainder = sum % 11;
  const verifier = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  if (digits[10] !== verifier) return 'El dígito verificador del CUIT es incorrecto';
  return null;
}

function validateDomicilio(dom: string): string | null {
  if (!dom.trim()) return 'La dirección es obligatoria';
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(dom)) return 'La dirección debe contener al menos una letra';
  return null;
}

const EMPTY_SUPPLIER_FORM = {
  name: '',
  cuit: '',
  address: '',
  phone: '',
  notes: '',
};

export default function PurchasesPage() {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

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

  // Modal nueva distribuidora
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER_FORM);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierError, setSupplierError] = useState('');

  // Modal pago a distribuidora
  const [paymentPurchase, setPaymentPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Modal cambiar distribuidora de una compra (solo ADMIN)
  const [editSupplierPurchase, setEditSupplierPurchase] = useState<Purchase | null>(null);
  const [editSupplierId, setEditSupplierId] = useState('');
  const [savingEditSupplier, setSavingEditSupplier] = useState(false);
  const [editSupplierError, setEditSupplierError] = useState('');

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

  useEffect(() => { loadData(); }, []);

  const selectedProduct = products.find((p) => p.id === Number(productId));

  // ── Distribuidora ──
  function openSupplierModal() {
    setSupplierForm(EMPTY_SUPPLIER_FORM);
    setSupplierError('');
    setShowSupplierModal(true);
  }

  function handleSupplierChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setSupplierForm({ ...supplierForm, [e.target.name]: e.target.value });
    setSupplierError('');
  }

  async function saveSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSupplierError('');

    if (!supplierForm.name.trim()) {
      setSupplierError('El nombre de fantasía es obligatorio');
      return;
    }

    const domErr = validateDomicilio(supplierForm.address);
    if (domErr) { setSupplierError(domErr); return; }

    if (supplierForm.cuit.trim()) {
      const cuitErr = validateCuit(supplierForm.cuit);
      if (cuitErr) { setSupplierError(cuitErr); return; }
    }

    setSavingSupplier(true);
    try {
      await api.post('/suppliers', {
        name: supplierForm.name.trim(),
        address: supplierForm.address.trim(),
        cuit: supplierForm.cuit.trim() ? normalizeCuit(supplierForm.cuit) : undefined,
        phone: supplierForm.phone.trim() || undefined,
        notes: supplierForm.notes.trim() || undefined,
      });
      setShowSupplierModal(false);
      setSupplierForm(EMPTY_SUPPLIER_FORM);
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setSupplierError(typeof msg === 'string' ? msg : 'Error al guardar la distribuidora');
    } finally {
      setSavingSupplier(false);
    }
  }

  // ── Pago a distribuidora ──
  function openPaymentModal(purchase: Purchase) {
    setPaymentPurchase(purchase);
    setPaymentAmount('');
    setPaymentError('');
  }

  function closePaymentModal() {
    setPaymentPurchase(null);
    setPaymentAmount('');
    setPaymentError('');
  }

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentPurchase) return;
    setPaymentError('');

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError('Ingresá un monto válido');
      return;
    }
    if (amount > Number(paymentPurchase.pendingAmount)) {
      setPaymentError(
        `El monto no puede superar el pendiente de ${formatARS(paymentPurchase.pendingAmount)}`,
      );
      return;
    }

    setSavingPayment(true);
    try {
      await api.post(`/purchases/${paymentPurchase.id}/payment`, { amount });
      closePaymentModal();
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setPaymentError(typeof msg === 'string' ? msg : 'Error al registrar el pago');
    } finally {
      setSavingPayment(false);
    }
  }

  // ── Cambiar distribuidora de una compra ──
  function openEditSupplierModal(purchase: Purchase) {
    setEditSupplierPurchase(purchase);
    setEditSupplierId(String(purchase.supplier?.id ?? ''));
    setEditSupplierError('');
  }

  function closeEditSupplierModal() {
    setEditSupplierPurchase(null);
    setEditSupplierId('');
    setEditSupplierError('');
  }

  async function saveEditSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!editSupplierPurchase) return;
    setEditSupplierError('');

    if (!editSupplierId) {
      setEditSupplierError('Seleccioná una distribuidora');
      return;
    }

    if (Number(editSupplierId) === editSupplierPurchase.supplier?.id) {
      setEditSupplierError('La distribuidora seleccionada es la misma que la actual');
      return;
    }

    setSavingEditSupplier(true);
    try {
      await api.patch(`/purchases/${editSupplierPurchase.id}/supplier`, {
        supplierId: Number(editSupplierId),
      });
      closeEditSupplierModal();
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setEditSupplierError(typeof msg === 'string' ? msg : 'Error al actualizar la distribuidora');
    } finally {
      setSavingEditSupplier(false);
    }
  }

  // ── Compra ──
  function addItem() {
    if (!productId) { alert('Seleccioná un producto'); return; }
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (!qty || qty <= 0) { alert('Ingresá una cantidad válida'); return; }
    if (!cost || cost <= 0) { alert('Ingresá un precio de costo válido'); return; }

    const product = products.find((p) => p.id === Number(productId));
    if (!product) return;

    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setItems(items.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + qty, unitCost: cost, subtotal: cost * (i.quantity + qty), updatePrice }
          : i,
      ));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitCost: cost,
        subtotal: cost * qty,
        updatePrice,
      }]);
    }

    setProductId('');
    setQuantity('');
    setUnitCost('');
    setUpdatePrice(false);
  }

  function removeItem(productId: number) {
    setItems(items.filter((i) => i.productId !== productId));
  }

  function editItem(item: PurchaseItem) {
    setProductId(String(item.productId));
    setQuantity(String(item.quantity));
    setUnitCost(String(item.unitCost));
    setUpdatePrice(item.updatePrice);
    setItems(items.filter((i) => i.productId !== item.productId));
  }

  const total = items.reduce((acc, i) => acc + i.subtotal, 0);

  async function createPurchase() {
    if (!supplierId) { alert('Seleccioná un proveedor'); return; }
    if (items.length === 0) { alert('Agregá productos a la compra'); return; }

    const paid = Number(paidAmount) || 0;
    if (paid < 0) { alert('El monto pagado no puede ser negativo'); return; }
    if (paid > total) { alert('El monto pagado no puede superar el total'); return; }

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
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  }

  const selectedSupplier = suppliers.find((s) => s.id === Number(supplierId));

  return (
    <div className="p-4 md:p-8">

      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:justify-between md:items-center md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Compras a Distribuidoras</h1>
        <button
          onClick={openSupplierModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold w-full md:w-auto"
        >
          + Nueva Distribuidora
        </button>
      </div>

      {/* Formulario nueva compra */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-2xl mb-8">
        <h2 className="text-xl font-bold mb-4">Registrar compra</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Distribuidora *</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700"
          >
            <option value="">Seleccionar distribuidora</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {selectedSupplier && (selectedSupplier.cuit || selectedSupplier.address) && (
            <div className="mt-2 text-xs text-gray-500 space-x-3">
              {selectedSupplier.cuit && <span>CUIT: {selectedSupplier.cuit}</span>}
              {selectedSupplier.address && <span>Dirección: {selectedSupplier.address}</span>}
            </div>
          )}
        </div>

        <div className="bg-gray-700 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-gray-300">Agregar producto</p>
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
          {/* Selector de producto — ocupa ancho completo */}
          <div className="mb-3">
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((p) => p.id === Number(e.target.value));
                if (p) setUnitCost(p.purchasePrice);
              }}
              className="w-full p-3 rounded-lg bg-gray-600"
            >
              <option value="">Seleccionar producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — stock: {p.stock}</option>
              ))}
            </select>
          </div>

          {/* Cantidad y Precio en grilla 2 columnas + botón abajo */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="number" placeholder="Cantidad" value={quantity} min={1}
              onChange={(e) => setQuantity(e.target.value)} className="p-3 rounded-lg bg-gray-600" />
            <input type="number" placeholder="Precio de costo" value={unitCost} min={0} step="0.01"
              onChange={(e) => setUnitCost(e.target.value)} className="p-3 rounded-lg bg-gray-600" />
          </div>
          <button onClick={addItem} className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold mb-3">
            Agregar
          </button>

          {selectedProduct && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              <span className="text-gray-400">
                Precio de compra actual:{' '}
                <span className="text-white">{formatARS(selectedProduct.purchasePrice)}</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer sm:ml-auto">
                <input type="checkbox" checked={updatePrice}
                  onChange={(e) => setUpdatePrice(e.target.checked)}
                  className="w-4 h-4 accent-blue-500" />
                <span className="text-gray-300">Actualizar precio y recalcular venta</span>
              </label>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Cantidad</th>
                <th className="p-3 text-left">Costo unit.</th>
                <th className="p-3 text-left">Subtotal</th>
                <th className="p-3 text-left">Actualiza precio</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No hay productos en la compra todavía
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.productId} className="border-b border-gray-700">
                    <td className="p-3">{item.productName}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3 text-gray-400">{formatARS(item.unitCost)}</td>
                    <td className="p-3 font-bold">{formatARS(item.subtotal)}</td>
                    <td className="p-3">
                      {item.updatePrice
                        ? <span className="text-green-400">Sí</span>
                        : <span className="text-gray-500">No</span>}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => editItem(item)}
                          className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg text-xs font-bold">
                          Editar
                        </button>
                        <button onClick={() => removeItem(item.productId)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-xs">
                          Quitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {items.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-700 p-4 rounded-xl">
              <p className="text-gray-400 text-sm mb-1">Total de la compra</p>
              <p className="text-2xl font-bold">{formatARS(total)}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Monto pagado (dejá en 0 si quedó todo en deuda)
              </label>
              <input type="number" placeholder="0" value={paidAmount} min={0} max={total} step="0.01"
                onChange={(e) => setPaidAmount(e.target.value)} className="w-full p-3 rounded-lg bg-gray-700" />
              {paidAmount && Number(paidAmount) < total && (
                <p className="text-sm text-yellow-400 mt-1">
                  Quedará pendiente con la distribuidora: {formatARS(total - Number(paidAmount))}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Notas (opcional)</label>
          <input type="text" placeholder="Ej: Factura B N°0001-00012345" value={notes}
            onChange={(e) => setNotes(e.target.value)} className="w-full p-3 rounded-lg bg-gray-700" />
        </div>

        <button onClick={createPurchase} disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-bold">
          {loading ? 'Registrando...' : 'Registrar Compra'}
        </button>
      </div>

      {/* Historial */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Historial de compras</h2>
        </div>

        {purchases.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No hay compras registradas todavía</p>
        ) : (
          <div className="divide-y divide-gray-700">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">
                      Compra #{purchase.id} — {purchase.supplier?.name}
                    </p>
                    <p className="text-gray-400 text-sm">{formatDate(purchase.createdAt)}</p>
                    {purchase.notes && (
                      <p className="text-gray-500 text-sm mt-1">{purchase.notes}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1 text-sm">
                    <p className="text-gray-400">
                      Total: <span className="text-white font-bold">{formatARS(purchase.total)}</span>
                    </p>
                    <p className="text-gray-400">
                      Pagado: <span className="text-green-400">{formatARS(purchase.paidAmount)}</span>
                    </p>
                    {Number(purchase.pendingAmount) > 0 ? (
                      <p className="text-red-400 font-bold">
                        Pendiente: {formatARS(purchase.pendingAmount)}
                      </p>
                    ) : (
                      <p className="text-green-400 font-bold">Pagado ✓</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setExpandedId(expandedId === purchase.id ? null : purchase.id)}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded-lg text-sm"
                  >
                    {expandedId === purchase.id ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>

                  {Number(purchase.pendingAmount) > 0 && (
                    <button
                      onClick={() => openPaymentModal(purchase)}
                      className="bg-green-700 hover:bg-green-600 px-4 py-1.5 rounded-lg text-sm font-bold"
                    >
                      💳 Registrar pago
                    </button>
                  )}

                  {/* Botón solo para ADMIN */}
                  {isAdmin && (
                    <button
                      onClick={() => openEditSupplierModal(purchase)}
                      className="bg-yellow-700 hover:bg-yellow-600 px-4 py-1.5 rounded-lg text-sm font-bold"
                    >
                      ✏️ Cambiar distribuidora
                    </button>
                  )}
                </div>

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
                          <tr key={d.id} className="border-b border-gray-600 last:border-0">
                            <td className="py-2">{d.productName}</td>
                            <td className="py-2">{d.quantity}</td>
                            <td className="py-2 text-gray-400">{formatARS(d.unitCost)}</td>
                            <td className="py-2 font-bold">{formatARS(d.subtotal)}</td>
                            <td className="py-2">
                              {d.updatePrice
                                ? <span className="text-green-400">Sí</span>
                                : <span className="text-gray-500">No</span>}
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

      {/* Modal nueva distribuidora */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form onSubmit={saveSupplier} className="bg-gray-800 p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Nueva Distribuidora</h2>
            <label className="block text-sm text-gray-400 mb-1">Nombre de fantasía *</label>
            <input type="text" name="name" placeholder="Ej: Distribuidora Paola"
              value={supplierForm.name} onChange={handleSupplierChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" />
            <label className="block text-sm text-gray-400 mb-1">Dirección *</label>
            <input type="text" name="address" placeholder="Ej: Av. Colón 1234"
              value={supplierForm.address} onChange={handleSupplierChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" />
            <label className="block text-sm text-gray-400 mb-1">
              DNI / CUIT / CUIL <span className="text-gray-600">(opcional)</span>
            </label>
            <input type="text" name="cuit" placeholder="Ej: 20-12345678-6"
              value={supplierForm.cuit} onChange={handleSupplierChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-1" />
            <p className="text-xs text-gray-500 mb-4">
              Si ingresás un CUIT de 11 dígitos se validará el dígito verificador
            </p>
            <label className="block text-sm text-gray-400 mb-1">
              Teléfono <span className="text-gray-600">(opcional)</span>
            </label>
            <input type="text" name="phone" placeholder="Ej: 3511234567"
              value={supplierForm.phone} onChange={handleSupplierChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" />
            <label className="block text-sm text-gray-400 mb-1">
              Notas <span className="text-gray-600">(opcional)</span>
            </label>
            <input type="text" name="notes" placeholder="Ej: Entrega los martes"
              value={supplierForm.notes} onChange={handleSupplierChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6" />
            {supplierError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
                {supplierError}
              </div>
            )}
            <div className="flex gap-4">
              <button type="submit" disabled={savingSupplier}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold">
                {savingSupplier ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setShowSupplierModal(false)} disabled={savingSupplier}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal pago a distribuidora */}
      {paymentPurchase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form onSubmit={savePayment} className="bg-gray-800 p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Registrar pago</h2>
            <p className="text-gray-400 text-sm mb-6">
              Compra #{paymentPurchase.id} — {paymentPurchase.supplier?.name}
            </p>

            <div className="bg-gray-700 rounded-xl p-4 mb-6 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Total de la compra:</span>
                <span className="text-white font-bold">{formatARS(paymentPurchase.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ya pagado:</span>
                <span className="text-green-400">{formatARS(paymentPurchase.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-1 mt-1">
                <span className="text-gray-400 font-bold">Pendiente:</span>
                <span className="text-red-400 font-bold">{formatARS(paymentPurchase.pendingAmount)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">Monto a pagar *</label>
              <button
                type="button"
                onClick={() => setPaymentAmount(String(paymentPurchase.pendingAmount))}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                Pagar total
              </button>
            </div>
            <input
              type="number"
              placeholder={`Máximo ${formatARS(paymentPurchase.pendingAmount)}`}
              value={paymentAmount}
              min={0.01}
              max={Number(paymentPurchase.pendingAmount)}
              step="0.01"
              onChange={(e) => { setPaymentAmount(e.target.value); setPaymentError(''); }}
              className="w-full p-3 rounded-lg bg-gray-700 mb-2"
              autoFocus
            />

            {paymentAmount && Number(paymentAmount) > 0 && Number(paymentAmount) <= Number(paymentPurchase.pendingAmount) && (
              <p className="text-xs text-gray-400 mb-4">
                Quedará pendiente:{' '}
                <span className={Number(paymentPurchase.pendingAmount) - Number(paymentAmount) === 0 ? 'text-green-400 font-bold' : 'text-yellow-400 font-bold'}>
                  {formatARS(Number(paymentPurchase.pendingAmount) - Number(paymentAmount))}
                </span>
              </p>
            )}

            {paymentError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
                {paymentError}
              </div>
            )}

            <div className="flex gap-4">
              <button type="submit" disabled={savingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold">
                {savingPayment ? 'Guardando...' : 'Confirmar pago'}
              </button>
              <button type="button" onClick={closePaymentModal} disabled={savingPayment}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal cambiar distribuidora (solo ADMIN) */}
      {editSupplierPurchase && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form onSubmit={saveEditSupplier} className="bg-gray-800 p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Cambiar distribuidora</h2>
            <p className="text-gray-400 text-sm mb-6">
              Compra #{editSupplierPurchase.id} — {formatDate(editSupplierPurchase.createdAt)}
            </p>

            <div className="bg-gray-700 rounded-xl p-4 mb-6 text-sm">
              <p className="text-gray-400 mb-1">Distribuidora actual:</p>
              <p className="text-white font-bold">{editSupplierPurchase.supplier?.name}</p>
            </div>

            <label className="block text-sm text-gray-400 mb-1">Nueva distribuidora *</label>
            <select
              value={editSupplierId}
              onChange={(e) => { setEditSupplierId(e.target.value); setEditSupplierError(''); }}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6"
            >
              <option value="">Seleccionar distribuidora</option>
              {suppliers
                .filter((s) => s.id !== editSupplierPurchase.supplier?.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {editSupplierError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
                {editSupplierError}
              </div>
            )}

            <div className="flex gap-4">
              <button type="submit" disabled={savingEditSupplier}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold">
                {savingEditSupplier ? 'Guardando...' : 'Confirmar cambio'}
              </button>
              <button type="button" onClick={closeEditSupplierModal} disabled={savingEditSupplier}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}