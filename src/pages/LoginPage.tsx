import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

type Mode = 'login' | 'register-first' | 'register';
type TipoFiscal = 'CONSUMIDOR_FINAL' | 'MONOTRIBUTISTA' | 'RESPONSABLE_INSCRIPTO';
type Step = 'tipo' | 'datos' | 'cuenta';

const TIPO_LABELS: Record<TipoFiscal, string> = {
  CONSUMIDOR_FINAL: 'Consumidor Final',
  MONOTRIBUTISTA: 'Monotributista',
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
};

const TIPO_DESC: Record<TipoFiscal, string> = {
  CONSUMIDOR_FINAL: 'Persona física que compra para uso personal',
  MONOTRIBUTISTA: 'Trabajador independiente inscripto en monotributo',
  RESPONSABLE_INSCRIPTO: 'Empresa o profesional inscripto en IVA',
};

// ── Validaciones ──

function normalizeDni(value: string): string {
  return value.replace(/[.\s]/g, '');
}

function normalizeCuit(value: string): string {
  return value.replace(/[-\s]/g, '');
}

function validateDni(dni: string): string | null {
  const normalized = normalizeDni(dni);
  if (!/^\d+$/.test(normalized)) return 'El DNI debe contener solo números';
  if (normalized.length < 7 || normalized.length > 8) return 'El DNI debe tener 7 u 8 dígitos';
  return null;
}

function validateCuit(cuit: string): string | null {
  const normalized = normalizeCuit(cuit);
  if (!/^\d+$/.test(normalized)) return 'El CUIT debe contener solo números';
  if (normalized.length !== 11) return 'El CUIT debe tener exactamente 11 dígitos';

  // Algoritmo dígito verificador AFIP
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = normalized.split('').map(Number);
  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
  const remainder = sum % 11;
  const verifier = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  if (digits[10] !== verifier) return 'El dígito verificador del CUIT es incorrecto';

  return null;
}

function validateTelefono(tel: string): string | null {
  if (!/^\d+$/.test(tel)) return 'El teléfono debe contener solo números (sin espacios, guiones ni +)';
  if (tel.length < 8 || tel.length > 15) return 'El teléfono debe tener entre 8 y 15 dígitos';
  return null;
}

function validateDomicilio(dom: string): string | null {
  if (!dom.trim()) return 'El domicilio es obligatorio';
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(dom)) return 'El domicilio debe contener al menos una letra';
  return null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('tipo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Primer admin
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Tipo fiscal
  const [tipoFiscal, setTipoFiscal] = useState<TipoFiscal | null>(null);

  // Datos fiscales
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [cuit, setCuit] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [razonSocial, setRazonSocial] = useState('');

  // Cuenta
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function checkUsers() {
      try {
        const res = await api.get('/users/has-users');
        if (!res.data.hasUsers) setMode('register-first');
      } catch { }
      finally { setCheckingUsers(false); }
    }
    checkUsers();
  }, []);

  function resetRegister() {
    setStep('tipo'); setTipoFiscal(null);
    setNombre(''); setApellido(''); setDni('');
    setCuit(''); setDomicilio(''); setRazonSocial('');
    setEmail(''); setTelefono('');
    setPassword(''); setConfirmPassword('');
    setError('');
  }

  // ── LOGIN ──
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!loginEmail.trim()) { setError('Ingresá tu email'); return; }
    if (!loginPassword) { setError('Ingresá tu contraseña'); return; }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally { setLoading(false); }
  }

  // ── PRIMER ADMIN ──
  async function handleRegisterFirst(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!adminName.trim()) { setError('Ingresá tu nombre'); return; }
    if (!adminEmail.trim()) { setError('Ingresá tu email'); return; }
    if (adminPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await api.post('/users/register-first', { name: adminName, email: adminEmail, password: adminPassword });
      await login(adminEmail, adminPassword);
      navigate('/');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Error al crear el usuario');
    } finally { setLoading(false); }
  }

  // ── PASO 1: tipo fiscal ──
  function handleTipoNext() {
    if (!tipoFiscal) { setError('Seleccioná tu tipo de contribuyente'); return; }
    setError('');
    setStep('datos');
  }

  // ── PASO 2: datos fiscales ──
  function handleDatosNext() {
    setError('');

    if (tipoFiscal === 'CONSUMIDOR_FINAL') {
      if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
      if (!apellido.trim()) { setError('Ingresá tu apellido'); return; }
      const dniErr = validateDni(dni);
      if (dniErr) { setError(dniErr); return; }
      const domErr = validateDomicilio(domicilio);
      if (domErr) { setError(domErr); return; }
    }

    if (tipoFiscal === 'MONOTRIBUTISTA') {
      if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
      if (!apellido.trim()) { setError('Ingresá tu apellido'); return; }
      const dniErr = validateDni(dni);
      if (dniErr) { setError(dniErr); return; }
      const cuitErr = validateCuit(cuit);
      if (cuitErr) { setError(cuitErr); return; }
      const domErr = validateDomicilio(domicilio);
      if (domErr) { setError(domErr); return; }
    }

    if (tipoFiscal === 'RESPONSABLE_INSCRIPTO') {
      if (!razonSocial.trim()) { setError('Ingresá la razón social'); return; }
      const cuitErr = validateCuit(cuit);
      if (cuitErr) { setError(cuitErr); return; }
      const domErr = validateDomicilio(domicilio);
      if (domErr) { setError(domErr); return; }
    }

    setStep('cuenta');
  }

  // ── PASO 3: cuenta ──
  async function handleCuentaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Ingresá tu email'); return; }

    const telErr = validateTelefono(telefono);
    if (telErr) { setError(telErr); return; }

    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    try {
      const displayName = tipoFiscal === 'RESPONSABLE_INSCRIPTO' ? razonSocial : nombre;

      await api.post('/users/register', {
        email,
        name: displayName,
        password,
        tipoFiscal,
        apellido: tipoFiscal !== 'RESPONSABLE_INSCRIPTO' ? apellido : undefined,
        dni: tipoFiscal === 'CONSUMIDOR_FINAL' ? normalizeDni(dni) : undefined,
        cuit: tipoFiscal !== 'CONSUMIDOR_FINAL' ? normalizeCuit(cuit) : undefined,
        domicilio,
        razonSocial: tipoFiscal === 'RESPONSABLE_INSCRIPTO' ? razonSocial : undefined,
        telefono,
      });
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      const msg = error.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Error al crear la cuenta');
      setStep('cuenta');
    } finally { setLoading(false); }
  }

  if (checkingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  // ── RENDER LOGIN ──
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold mb-1">Distribuidora</h1>
          <p className="text-gray-400 mb-8 text-sm">Gustavo — Sistema de gestión</p>
          <form onSubmit={handleLogin}>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" placeholder="ejemplo@correo.com"
              value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" disabled={loading}
            />
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input type="password" placeholder="••••••••"
              value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6" disabled={loading}
            />
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <button onClick={() => { resetRegister(); setMode('register'); }}
              className="text-blue-400 hover:text-blue-300"
            >
              ¿No tenés cuenta? Registrate
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER PRIMER ADMIN ──
  if (mode === 'register-first') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-xl">
          <h1 className="text-3xl font-bold mb-1">Distribuidora</h1>
          <p className="text-gray-400 mb-6 text-sm">Creá el primer administrador</p>
          <div className="mb-6 p-3 bg-blue-900/40 border border-blue-700 rounded-lg text-sm text-blue-300">
            No hay usuarios registrados. Creá el primer administrador del sistema.
          </div>
          <form onSubmit={handleRegisterFirst}>
            <label className="block text-sm text-gray-400 mb-1">Nombre</label>
            <input type="text" placeholder="Ej: Gustavo"
              value={adminName} onChange={(e) => setAdminName(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" disabled={loading}
            />
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" placeholder="ejemplo@correo.com"
              value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 mb-4" disabled={loading}
            />
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input type="password" placeholder="••••••••"
              value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 mb-6" disabled={loading}
            />
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold"
            >
              {loading ? 'Creando...' : 'Crear administrador'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── RENDER REGISTRO CLIENTE ──
  const stepNumber = step === 'tipo' ? 1 : step === 'datos' ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-8">
      <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Crear cuenta</h1>
            <p className="text-gray-400 text-sm mt-0.5">Paso {stepNumber} de 3</p>
          </div>
          <button onClick={() => { setMode('login'); resetRegister(); }}
            className="text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Volver al login
          </button>
        </div>

        {/* Progreso */}
        <div className="flex gap-1 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${s <= stepNumber ? 'bg-blue-500' : 'bg-gray-600'}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">{error}</div>
        )}

        {/* PASO 1 — Tipo fiscal */}
        {step === 'tipo' && (
          <div>
            <p className="text-gray-300 font-bold mb-4">¿Cuál es tu condición fiscal?</p>
            <div className="space-y-3 mb-8">
              {(Object.keys(TIPO_LABELS) as TipoFiscal[]).map((tipo) => (
                <button key={tipo} type="button"
                  onClick={() => { setTipoFiscal(tipo); setError(''); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    tipoFiscal === tipo
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700'
                  }`}
                >
                  <p className="font-bold text-white">{TIPO_LABELS[tipo]}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{TIPO_DESC[tipo]}</p>
                </button>
              ))}
            </div>
            <button onClick={handleTipoNext}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 2 — Datos fiscales */}
        {step === 'datos' && tipoFiscal && (
          <div>
            <p className="text-gray-300 font-bold mb-4">Datos de {TIPO_LABELS[tipoFiscal]}</p>

            {/* Consumidor Final */}
            {tipoFiscal === 'CONSUMIDOR_FINAL' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                  <input type="text" placeholder="Ej: María"
                    value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Apellido *</label>
                  <input type="text" placeholder="Ej: González"
                    value={apellido} onChange={(e) => { setApellido(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">DNI *</label>
                  <input type="text" placeholder="Ej: 38123456"
                    value={dni} onChange={(e) => { setDni(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">7 u 8 dígitos, sin puntos</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Domicilio *</label>
                  <input type="text" placeholder="Ej: Av. Colón 1234"
                    value={domicilio} onChange={(e) => { setDomicilio(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
              </div>
            )}

            {/* Monotributista */}
            {tipoFiscal === 'MONOTRIBUTISTA' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                  <input type="text" placeholder="Ej: Carlos"
                    value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Apellido *</label>
                  <input type="text" placeholder="Ej: Rodríguez"
                    value={apellido} onChange={(e) => { setApellido(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">DNI *</label>
                  <input type="text" placeholder="Ej: 38123456"
                    value={dni} onChange={(e) => { setDni(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">7 u 8 dígitos, sin puntos</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CUIT *</label>
                  <input type="text" placeholder="Ej: 20-38123456-7"
                    value={cuit} onChange={(e) => { setCuit(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">11 dígitos, con o sin guiones</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Domicilio fiscal *</label>
                  <input type="text" placeholder="Ej: Av. Colón 1234"
                    value={domicilio} onChange={(e) => { setDomicilio(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
              </div>
            )}

            {/* Responsable Inscripto */}
            {tipoFiscal === 'RESPONSABLE_INSCRIPTO' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Razón social *</label>
                  <input type="text" placeholder="Ej: Kiosco Central S.R.L."
                    value={razonSocial} onChange={(e) => { setRazonSocial(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CUIT *</label>
                  <input type="text" placeholder="Ej: 30-12345678-9"
                    value={cuit} onChange={(e) => { setCuit(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">11 dígitos, con o sin guiones</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Domicilio fiscal *</label>
                  <input type="text" placeholder="Ej: Av. Colón 1234"
                    value={domicilio} onChange={(e) => { setDomicilio(e.target.value); setError(''); }}
                    className="w-full p-3 rounded-lg bg-gray-700"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setStep('tipo'); setError(''); }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 p-3 rounded-lg"
              >
                ← Atrás
              </button>
              <button type="button" onClick={handleDatosNext}
                className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* PASO 3 — Cuenta */}
        {step === 'cuenta' && (
          <form onSubmit={handleCuentaSubmit}>
            <p className="text-gray-300 font-bold mb-4">Datos de tu cuenta</p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email *</label>
                <input type="email" placeholder="ejemplo@correo.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full p-3 rounded-lg bg-gray-700" disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Teléfono *</label>
                <input type="text" placeholder="Ej: 3511234567"
                  value={telefono} onChange={(e) => { setTelefono(e.target.value); setError(''); }}
                  className="w-full p-3 rounded-lg bg-gray-700" disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Solo números, sin espacios ni guiones</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Contraseña * (mínimo 6 caracteres)
                </label>
                <input type="password" placeholder="••••••••"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full p-3 rounded-lg bg-gray-700" disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirmar contraseña *</label>
                <input type="password" placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  className={`w-full p-3 rounded-lg ${
                    confirmPassword && confirmPassword !== password
                      ? 'bg-red-900/30 border border-red-500'
                      : 'bg-gray-700'
                  }`}
                  disabled={loading}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep('datos'); setError(''); }}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:cursor-not-allowed p-3 rounded-lg"
              >
                ← Atrás
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}