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

export default function AccountsPage() {

  const [accounts, setAccounts] =
    useState<Account[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {

    const response =
      await api.get(
        '/customers/accounts',
      );

    setAccounts(response.data);
  }

  return (
    <div className="p-8">

      <h1
        className="
          text-4xl
          font-bold
          mb-8
        "
      >
        Cuentas Corrientes
      </h1>

      <div
        className="
          grid
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {accounts.map((account) => (

          <div
            key={account.customerId}

            className="
              bg-gray-800
              rounded-2xl
              p-6
              shadow-lg
            "
          >

            <h2
              className="
                text-2xl
                font-bold
                mb-4
              "
            >
              {
                account.customerName
              }
            </h2>

            <div className="space-y-2">

              <p>
                Pedidos:
                {' '}
                {
                  account.totalOrders
                }
              </p>

              <p>
                Total Comprado:
                {' '}
                $
                {
                  account.totalSpent
                }
              </p>

              <p
                className={`
                  font-bold

                  ${
                    account.totalPending > 0
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                `}
              >
                Pendiente:
                {' '}
                $
                {
                  account.totalPending
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}