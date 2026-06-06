import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Account = {
  customerId: number;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  totalPending: number;
};

function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export default function AccountsPage() {
  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [loading, setLoading] =
    useState(true);

  async function loadAccounts() {
    setLoading(true);
    try {
      const response = await api.get(
        '/customers/accounts',
      );
      setAccounts(response.data);
    } catch {
      alert('Error al cargar las cuentas corrientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const withDebt = accounts.filter(
    (a) => a.totalPending > 0,
  );
  const noDebt = accounts.filter(
    (a) => a.totalPending === 0,
  );

  // Ordenar: primero los que tienen deuda, mayor deuda primero
  const sorted = [
    ...withDebt.sort(
      (a, b) => b.totalPending - a.totalPending,
    ),
    ...noDebt,
  ];

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Cuentas Corrientes
        </h1>

        {!loading && accounts.length > 0 && (
          <div className="text-right">
            <p className="text-gray-400 text-sm">
              Total pendiente general
            </p>
            <p className="text-red-400 font-bold text-2xl">
              {formatARS(
                accounts.reduce(
                  (acc, a) => acc + a.totalPending,
                  0,
                ),
              )}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">
          Cargando cuentas...
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-12 text-center text-gray-500">
          No hay cuentas corrientes registradas todavía
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((account) => (
            <div
              key={account.customerId}
              className={`
                bg-gray-800
                rounded-2xl
                p-6
                shadow-lg
                border-l-4
                ${account.totalPending > 0
                  ? 'border-red-500'
                  : 'border-green-500'}
              `}
            >
              <h2 className="text-xl font-bold mb-4 truncate">
                {account.customerName}
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Pedidos
                  </span>
                  <span className="font-bold">
                    {account.totalOrders}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Total comprado
                  </span>
                  <span className="font-bold">
                    {formatARS(account.totalSpent)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                  <span className="text-gray-400 font-bold">
                    Pendiente
                  </span>
                  <span
                    className={`font-bold text-base ${
                      account.totalPending > 0
                        ? 'text-red-400'
                        : 'text-green-400'
                    }`}
                  >
                    {account.totalPending > 0
                      ? formatARS(account.totalPending)
                      : 'Al día ✓'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}