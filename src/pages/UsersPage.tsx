import { useEffect, useState } from 'react';
import api from '../api/axios';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type Customer = {
  id: number;
  name: string;
  userId: number | null;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OWNER: 'Dueño',
  CLIENT: 'Cliente',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-900 text-red-300',
  OWNER: 'bg-blue-900 text-blue-300',
  CLIENT: 'bg-green-900 text-green-300',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'OWNER',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [changingRoleId, setChangingRoleId] = useState<number | null>(null);
  const [linkingUserId, setLinkingUserId] = useState<number | null>(null);

  async function loadData() {
    try {
      const [usersRes, customersRes] = await Promise.all([
        api.get('/users'),
        api.get('/customers'),
      ]);
      setUsers(usersRes.data);
      setCustomers(customersRes.data);
    } catch {
      alert('Error al cargar los datos');
    }
  }

  useEffect(() => { loadData(); }, []);

  // Buscar qué cliente tiene vinculado un userId
  function getLinkedCustomer(userId: number): Customer | null {
    return customers.find((c) => c.userId === userId) ?? null;
  }

  // Clientes disponibles para vincular (sin usuario vinculado, o el actual)
  function availableCustomers(currentUserId: number): Customer[] {
    return customers.filter(
      (c) => c.userId === null || c.userId === currentUserId,
    );
  }

  async function changeRole(id: number, newRole: string) {
    setChangingRoleId(id);
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'Error al cambiar el rol');
    } finally {
      setChangingRoleId(null);
    }
  }

  async function linkCustomer(userId: number, customerId: string) {
    setLinkingUserId(userId);
    try {
      if (customerId === '') {
        // Desvincular — primero buscar el cliente actual vinculado
        const linked = getLinkedCustomer(userId);
        if (linked) {
          await api.patch(`/customers/${linked.id}/link-user`, { userId: null });
        }
      } else {
        await api.patch(`/customers/${customerId}/link-user`, { userId });
      }
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'Error al vincular el cliente');
    } finally {
      setLinkingUserId(null);
    }
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { alert('El nombre es obligatorio'); return; }
    if (!form.email.trim()) { alert('El email es obligatorio'); return; }
    if (form.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      closeModal();
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: number, name: string) {
    if (!confirm(`¿Eliminar al usuario "${name}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/users/${id}`);
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert(typeof msg === 'string' ? 'Error: ' + msg : 'No se pudo eliminar el usuario');
    }
  }

  const clientUsers = users.filter((u) => u.role === 'CLIENT');
  const otherUsers = users.filter((u) => u.role !== 'CLIENT');

  return (
    <div className="p-8">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Usuarios</h1>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Tabla usuarios ADMIN y OWNER */}
      {otherUsers.length > 0 && (
        <div className="bg-gray-800 rounded-2xl overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-bold text-lg">Administradores y Dueños</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Rol actual</th>
                <th className="p-4 text-left">Cambiar rol</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {otherUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[user.role] ?? 'bg-gray-700 text-gray-300'}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      disabled={changingRoleId === user.id}
                      className="p-2 rounded-lg bg-gray-700 text-sm disabled:opacity-50"
                    >
                      <option value="CLIENT">Cliente</option>
                      <option value="OWNER">Dueño</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => deleteUser(user.id, user.name)}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla usuarios CLIENT con vinculación */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="font-bold text-lg">Clientes</h2>
          <p className="text-sm text-gray-400 mt-1">
            Vinculá cada usuario cliente con su registro en la lista de clientes
          </p>
        </div>

        {clientUsers.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            No hay usuarios con rol Cliente todavía
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 text-left">Nombre</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Rol</th>
                <th className="p-4 text-left">Vincular con cliente</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientUsers.map((user) => {
                const linked = getLinkedCustomer(user.id);
                const available = availableCustomers(user.id);
                return (
                  <tr key={user.id} className="border-b border-gray-700">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-gray-400">{user.email}</td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        disabled={changingRoleId === user.id}
                        className="p-2 rounded-lg bg-gray-700 text-sm disabled:opacity-50"
                      >
                        <option value="CLIENT">Cliente</option>
                        <option value="OWNER">Dueño</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={linked ? String(linked.id) : ''}
                          onChange={(e) => linkCustomer(user.id, e.target.value)}
                          disabled={linkingUserId === user.id}
                          className="p-2 rounded-lg bg-gray-700 text-sm disabled:opacity-50 max-w-[200px]"
                        >
                          <option value="">— Sin vincular —</option>
                          {available.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {linked && (
                          <span className="text-xs text-green-400">✓ Vinculado</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteUser(user.id, user.name)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <form
            onSubmit={saveUser}
            className="bg-gray-800 p-8 rounded-2xl w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6">Nuevo Usuario</h2>

            <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
            <input type="text" name="name" placeholder="Ej: María"
              value={form.name} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" required
            />

            <label className="block text-sm text-gray-400 mb-1">Email *</label>
            <input type="email" name="email" placeholder="ejemplo@correo.com"
              value={form.email} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" required
            />

            <label className="block text-sm text-gray-400 mb-1">
              Contraseña * (mínimo 6 caracteres)
            </label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" required
            />

            <label className="block text-sm text-gray-400 mb-1">Rol *</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6"
            >
              <option value="CLIENT">Cliente</option>
              <option value="OWNER">Dueño</option>
              <option value="ADMIN">Administrador</option>
            </select>

            <div className="flex gap-4">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold"
              >
                {loading ? 'Guardando...' : 'Crear Usuario'}
              </button>
              <button type="button" onClick={closeModal} disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg"
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