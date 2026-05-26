import {
  useEffect,
  useState,
} from 'react';

import api from '../api/axios';

type Product = {
  id: number;

  name: string;

  purchasePrice: string;

  profitMargin: string;

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

  const [editId, setEditId] =
    useState<number | null>(null);
  
  const [onlyLowStock, setOnlyLowStock] =
    useState(false);

  const filteredProducts =
    onlyLowStock
      ? products.filter(
          (product) =>
            product.stock <= 5,
        )
      : products;

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

  function editProduct(
    product: any,
    ) {

    setEditId(product.id);

    setName(product.name);

    setPurchasePrice(
        product.purchasePrice,
    );

    setProfitMargin(
        product.profitMargin,
    );

    setStock(
        String(product.stock),
    );

    setShowModal(true);
    }

    async function createProduct(
        e: React.FormEvent,
    ) {

        e.preventDefault();

        const payload = {
            name,

            purchasePrice:
            Number(purchasePrice),

            profitMargin:
            Number(profitMargin),

            stock:
            Number(stock),
    };

    if (editId) {

        await api.put(
        `/products/${editId}`,
        payload,
        );

    } else {

        await api.post(
        '/products',
        payload,
        );
    }

    setShowModal(false);

    setEditId(null);

    setName('');
    setPurchasePrice('');
    setProfitMargin('');
    setStock('');

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

        <button
          onClick={() =>
            setOnlyLowStock(
              !onlyLowStock,
            )
          }

          className="
            bg-yellow-600
            hover:bg-yellow-700
            px-4
            py-2
            rounded-lg
            font-bold
          "
        >
          {
            onlyLowStock
              ? 'Ver Todos'
              : 'Stock Bajo'
          }
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

            {filteredProducts.map((product) => (

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

                  <span
                    className={`
                      px-3
                      py-1
                      rounded-full
                      font-bold

                      ${
                        product.stock <= 5
                          ? 'bg-red-600'
                          : product.stock <= 10
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }
                    `}
                  >
                    {product.stock}
                  </span>
                </td>

                <td className="p-4">

                  {product.active
                    ? 'Activo'
                    : 'Inactivo'}

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
                        editProduct(product)
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
            {
              editId
                ? 'Editar Producto'
                : 'Nuevo Producto'
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
}