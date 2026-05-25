import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Product = {
  id: number;

  name: string;

  salePrice: string;

  stock: number;

  active: boolean;
};

export default function ProductsPage() {

  const [products, setProducts] =
    useState<Product[]>([]);


  const [showModal, setShowModal] =
  useState(false);

  const [name, setName] =
    useState('');

  const [purchasePrice, setPurchasePrice] =
    useState('');

  const [profitMargin, setProfitMargin] =
    useState('');

  const [stock, setStock] =
    useState('');

  async function loadProducts() {

    const response =
      await api.get('/products');

    setProducts(response.data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function deleteProduct(
    id: number,
  ) {

    const confirmDelete =
      confirm(
        '¿Eliminar producto?',
      );

    if (!confirmDelete) {
      return;
    }

    await api.delete(
      `/products/${id}`,
    );

    loadProducts();
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
          Productos
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
            Nuevo Producto
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
                Producto
              </th>

              <th className="p-4 text-left">
                Precio
              </th>

              <th className="p-4 text-left">
                Stock
              </th>

              <th className="p-4 text-left">
                Estado
              </th>

              <th className="p-4">
                Acciones
              </th>

            </tr>
          </thead>

          <tbody>

            {products.map((product) => (

              <tr
                key={product.id}

                className="
                  border-b
                  border-gray-700
                "
              >

                <td className="p-4">
                  {product.name}
                </td>

                <td className="p-4">
                  ${product.salePrice}
                </td>

                <td className="p-4">
                  {product.stock}
                </td>

                <td className="p-4">

                  {product.active
                    ? 'Activo'
                    : 'Inactivo'}

                </td>

                <td className="p-4">

                  <button
                    onClick={() =>
                      deleteProduct(
                        product.id,
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
            onSubmit={createProduct}

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
            Nuevo Producto
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
            type="number"

            placeholder="Precio compra"

            value={purchasePrice}

            onChange={(e) =>
                setPurchasePrice(
                e.target.value,
                )
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
            type="number"

            placeholder="Margen %"

            value={profitMargin}

            onChange={(e) =>
                setProfitMargin(
                e.target.value,
                )
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
            type="number"

            placeholder="Stock"

            value={stock}

            onChange={(e) =>
                setStock(
                e.target.value,
                )
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
                Guardar
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
  async function createProduct(
    e: React.FormEvent,
    ) {

    e.preventDefault();

    await api.post('/products', {
        name,

        purchasePrice:
        Number(purchasePrice),

        profitMargin:
        Number(profitMargin),

        stock:
        Number(stock),
    });

    setShowModal(false);

    setName('');
    setPurchasePrice('');
    setProfitMargin('');
    setStock('');

    loadProducts();
    }
}