import { useEffect, useState } from 'react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';

type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
  active: boolean;
};

type ConfirmState = {
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
} | null;

const EMPTY_FORM = { name: '', phone: '', address: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [sort, setSort] = useState<'default' | 'az' | 'za'>('default');
  const [search, setSearch] = useState('');

  async function loadCustomers() {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch {
      alert('Error al cargar los clientes');
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  const sortedCustomers = [...customers].sort((a, b) => {
    if (sort === 'az') return a.name.localeCompare(b.name);
    if (sort === 'za') return b.name.localeCompare(a.name);
    return 0;
  }).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  function openNewModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(customer: Customer) {
    setEditId(customer.id);
    setForm({ name: customer.name, phone: customer.phone || '', address: customer.address || '' });
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

  async function saveCustomer(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('El nombre del cliente es obligatorio'); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (editId) {
        await api.put(`/customers/${editId}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      closeModal();
      loadCustomers();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) setFormError('Error: ' + msg.join('. '));
      else if (typeof msg === 'string') setFormError('Error: ' + msg);
      else setFormError('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(id: number, name: string) {
    setConfirm({
      message: `¿Eliminar a "${name}"?`,
      subMessage: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/customers/${id}`);
          loadCustomers();
        } catch (error: any) {
          const msg = error.response?.data?.message;
          setConfirm({
            message: typeof msg === 'string' ? msg : 'No se pudo eliminar el cliente',
            confirmLabel: 'Aceptar',
            confirmColor: 'bg-blue-600 hover:bg-blue-700',
            onConfirm: () => setConfirm(null),
          });
        }
      },
    });
  }

  return (
    <div className="p-4 md:p-8">

      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-3xl md:text-4xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'default' | 'az' | 'za')}
            className="p-2 rounded-lg bg-gray-700 text-sm"
          >
            <option value="default">Orden de carga</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
          <button onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold text-sm">
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-sm pr-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        )}
      </div>

      {/* Vista desktop — tabla */}
      <div className="hidden md:block bg-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Teléfono</th>
              <th className="p-4 text-left">Dirección</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  {search ? `No se encontraron clientes para "${search}"` : 'No hay clientes cargados todavía'}
                </td>
              </tr>
            ) : (
              sortedCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-700">
                  <td className="p-4 font-medium">{customer.name}</td>
                  <td className="p-4 text-gray-400">{customer.phone || <span className="text-gray-600 italic">Sin teléfono</span>}</td>
                  <td className="p-4 text-gray-400">{customer.address || <span className="text-gray-600 italic">Sin dirección</span>}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEditModal(customer)} className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm">Editar</button>
                      <button onClick={() => confirmDelete(customer.id, customer.name)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista mobile — tarjetas */}
      <div className="md:hidden space-y-3">
        {sortedCustomers.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-8 text-center text-gray-500">
            {search ? `No se encontraron clientes para "${search}"` : 'No hay clientes cargados todavía'}
          </div>
        ) : (
          sortedCustomers.map((customer) => (
            <div key={customer.id} className="bg-gray-800 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white text-lg">{customer.name}</h3>
              </div>
              <div className="space-y-1 text-sm mb-4">
                <p className="text-gray-400">
                  📞 {customer.phone || <span className="text-gray-600 italic">Sin teléfono</span>}
                </p>
                <p className="text-gray-400">
                  📍 {customer.address || <span className="text-gray-600 italic">Sin dirección</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(customer)} className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2 rounded-lg text-sm font-bold">Editar</button>
                <button onClick={() => confirmDelete(customer.id, customer.name)} className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm font-bold">Eliminar</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50">
          <form
            onSubmit={saveCustomer}
            className="bg-gray-800 p-6 md:p-8 rounded-t-2xl md:rounded-2xl w-full md:max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>

            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input type="text" name="name" placeholder="Ej: Kiosco Central"
              value={form.name} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" required />

            <label className="block text-sm text-gray-400 mb-1">Teléfono</label>
            <input type="text" name="phone" placeholder="Ej: 351 123 4567"
              value={form.phone} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" />

            <label className="block text-sm text-gray-400 mb-1">Dirección</label>
            <input type="text" name="address" placeholder="Ej: Av. Colón 1234"
              value={form.address} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6" />

            {formError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">{formError}</div>
            )}

            <div className="flex gap-4">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold">
                {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={closeModal} disabled={loading}
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