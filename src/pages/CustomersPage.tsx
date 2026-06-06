import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
  active: boolean;
};

const EMPTY_FORM = {
  name: '',
  phone: '',
  address: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editId, setEditId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(false);

  async function loadCustomers() {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch {
      alert('Error al cargar los clientes');
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function openNewModal() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(customer: Customer) {
    setEditId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
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

  async function saveCustomer(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
    };

    setLoading(true);

    try {
      if (editId) {
        await api.put(`/customers/${editId}`, payload);
      } else {
        await api.post('/customers', payload);
      }

      closeModal();
      loadCustomers();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        alert('Error: ' + msg.join('\n'));
      } else if (typeof msg === 'string') {
        alert('Error: ' + msg);
      } else {
        alert('Error al guardar el cliente');
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteCustomer(
    id: number,
    name: string,
  ) {
    const confirmDelete = confirm(
      `¿Eliminar a "${name}"?\nEsta acción no se puede deshacer.`,
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(
        typeof msg === 'string'
          ? 'Error: ' + msg
          : 'No se pudo eliminar el cliente',
      );
    }
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Clientes
        </h1>

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
          + Nuevo Cliente
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
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
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-gray-500"
                >
                  No hay clientes cargados todavía
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-gray-700"
                >
                  <td className="p-4 font-medium">
                    {customer.name}
                  </td>

                  <td className="p-4 text-gray-400">
                    {customer.phone || (
                      <span className="text-gray-600 italic">
                        Sin teléfono
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-gray-400">
                    {customer.address || (
                      <span className="text-gray-600 italic">
                        Sin dirección
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() =>
                          openEditModal(customer)
                        }
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
                          deleteCustomer(
                            customer.id,
                            customer.name,
                          )
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
            onSubmit={saveCustomer}
            className="bg-gray-800 p-8 rounded-2xl w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">
              {editId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>

            <label className="block text-sm text-gray-400 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ej: Kiosco Central"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4"
              required
            />

            <label className="block text-sm text-gray-400 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              name="phone"
              placeholder="Ej: 351 123 4567"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4"
            />

            <label className="block text-sm text-gray-400 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="address"
              placeholder="Ej: Av. Colón 1234"
              value={form.address}
              onChange={handleChange}
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
                {loading
                  ? 'Guardando...'
                  : editId
                  ? 'Actualizar'
                  : 'Guardar'}
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