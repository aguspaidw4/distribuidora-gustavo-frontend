import {
  useState,
} from 'react';

import {
  useAuth,
} from '../auth/AuthContext';

export default function LoginPage() {

  const {
    login,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  async function handleSubmit(
    e: React.FormEvent,
  ) {

    e.preventDefault();

    try {

      await login(
        email,
        password,
      );

      alert('Login correcto');

    } catch {

      alert('Error login');
    }
  }

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-900
      "
    >

      <form
        onSubmit={handleSubmit}

        className="
          bg-gray-800
          p-8
          rounded-2xl
          w-full
          max-w-md
          shadow-xl
        "
      >

        <h1
          className="
            text-3xl
            font-bold
            mb-6
          "
        >
          Distribuidora System
        </h1>

        <input
          type="email"

          placeholder="Email"

          value={email}

          onChange={(e) =>
            setEmail(e.target.value)
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
          type="password"

          placeholder="Password"

          value={password}

          onChange={(e) =>
            setPassword(e.target.value)
          }

          className="
            w-full
            p-3
            rounded-lg
            bg-gray-700
            mb-6
          "
        />

        <button
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            p-3
            rounded-lg
            font-bold
          "
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}