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

export default function CustomersPage() {

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editId, setEditId] =
    useState<number | null>(null);

  const [name, setName] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [address, setAddress] =
    useState('');

  async function loadCustomers() {

    const response =
      await api.get('/customers');

    setCustomers(response.data);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function saveCustomer(
    e: React.FormEvent,
  ) {

    e.preventDefault();

    const payload = {
      name,
      phone,
      address,
    };

    if (editId) {

      await api.put(
        `/customers/${editId}`,
        payload,
      );

    } else {

      await api.post(
        '/customers',
        payload,
      );
    }

    setShowModal(false);

    setEditId(null);

    setName('');
    setPhone('');
    setAddress('');

    loadCustomers();
  }

  function editCustomer(
    customer: Customer,
  ) {

    setEditId(customer.id);

    setName(customer.name);

    setPhone(customer.phone || '');

    setAddress(customer.address || '');

    setShowModal(true);
  }

  async function deleteCustomer(
    id: number,
  ) {

    const confirmDelete =
      confirm(
        '¿Eliminar cliente?',
      );

    if (!confirmDelete) {
      return;
    }

    await api.delete(
      `/customers/${id}`,
    );

    loadCustomers();
  }

  return (
    <div className="p-8">

      <div
        className="
          flex
          justify-between
          items-center
          mb-8
        "
      >

        <h1
          className="
            text-4xl
            font-bold
          "
        >
          Clientes
        </h1>

        <button
          onClick={() =>
            setShowModal(true)
          }

          className="
            bg-blue-600
            hover:bg-blue-700
            px-4
            py-2
            rounded-lg
            font-bold
          "
        >
          Nuevo Cliente
        </button>
      </div>

      <div
        className="
          bg-gray-800
          rounded-2xl
          overflow-hidden
        "
      >

        <table className="w-full">

          <thead
            className="
              bg-gray-700
            "
          >

            <tr>

              <th className="p-4 text-left">
                Cliente
              </th>

              <th className="p-4 text-left">
                Teléfono
              </th>

              <th className="p-4 text-left">
                Dirección
              </th>

              <th className="p-4">
                Acciones
              </th>

            </tr>
          </thead>

          <tbody>

            {customers.map((customer) => (

              <tr
                key={customer.id}

                className="
                  border-b
                  border-gray-700
                "
              >

                <td className="p-4">
                  {customer.name}
                </td>

                <td className="p-4">
                  {customer.phone}
                </td>

                <td className="p-4">
                  {customer.address}
                </td>

                <td className="p-4">

                  <div
                    className="
                      flex
                      gap-2
                      justify-center
                    "
                  >

                    <button
                      onClick={() =>
                        editCustomer(
                          customer,
                        )
                      }

                      className="
                        bg-yellow-600
                        hover:bg-yellow-700
                        px-4
                        py-2
                        rounded-lg
                      "
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        deleteCustomer(
                          customer.id,
                        )
                      }

                      className="
                        bg-red-600
                        hover:bg-red-700
                        px-4
                        py-2
                        rounded-lg
                      "
                    >
                      Eliminar
                    </button>

                  </div>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {
        showModal && (

          <div
            className="
              fixed
              inset-0
              bg-black/70
              flex
              items-center
              justify-center
            "
          >

            <form
              onSubmit={saveCustomer}

              className="
                bg-gray-800
                p-8
                rounded-2xl
                w-full
                max-w-md
              "
            >

              <h2
                className="
                  text-2xl
                  font-bold
                  mb-6
                "
              >
                {
                  editId
                    ? 'Editar Cliente'
                    : 'Nuevo Cliente'
                }
              </h2>

              <input
                type="text"

                placeholder="Nombre"

                value={name}

                onChange={(e) =>
                  setName(e.target.value)
                }

                className="
                  w-full
                  p-3
                  rounded-lg
                  bg-gray-700
                  mb-4
                "
              />

              <input
                type="text"

                placeholder="Teléfono"

                value={phone}

                onChange={(e) =>
                  setPhone(e.target.value)
                }

                className="
                  w-full
                  p-3
                  rounded-lg
                  bg-gray-700
                  mb-4
                "
              />

              <input
                type="text"

                placeholder="Dirección"

                value={address}

                onChange={(e) =>
                  setAddress(e.target.value)
                }

                className="
                  w-full
                  p-3
                  rounded-lg
                  bg-gray-700
                  mb-6
                "
              />

              <div
                className="
                  flex
                  gap-4
                "
              >

                <button
                  type="submit"

                  className="
                    flex-1
                    bg-blue-600
                    hover:bg-blue-700
                    p-3
                    rounded-lg
                  "
                >
                  {
                    editId
                      ? 'Actualizar'
                      : 'Guardar'
                  }
                </button>

                <button
                  type="button"

                  onClick={() =>
                    setShowModal(false)
                  }

                  className="
                    flex-1
                    bg-gray-600
                    hover:bg-gray-700
                    p-3
                    rounded-lg
                  "
                >
                  Cancelar
                </button>

              </div>
            </form>
          </div>
        )
      }
    </div>
  );
}