import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Ingresá tu email');
      return;
    }

    if (!password) {
      setError('Ingresá tu contraseña');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold mb-2">
          Distribuidora
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          Gustavo — Sistema de gestión
        </p>

        <label className="block text-sm text-gray-400 mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          className="
            w-full p-3
            rounded-lg
            bg-gray-700
            mb-4
          "
          disabled={loading}
        />

        <label className="block text-sm text-gray-400 mb-1">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          className="
            w-full p-3
            rounded-lg
            bg-gray-700
            mb-6
          "
          disabled={loading}
        />

        {/* Mensaje de error */}
        {error && (
          <div className="
            mb-4
            p-3
            bg-red-900/50
            border border-red-500
            rounded-lg
            text-red-300
            text-sm
          ">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            disabled:bg-gray-600
            disabled:cursor-not-allowed
            p-3
            rounded-lg
            font-bold
            transition-colors
          "
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}