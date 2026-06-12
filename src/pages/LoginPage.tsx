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

function normalizeDni(v: string) { return v.replace(/[.\s]/g, ''); }
function normalizeCuit(v: string) { return v.replace(/[-\s]/g, ''); }

function validateDni(dni: string): string | null {
  const n = normalizeDni(dni);
  if (!/^\d+$/.test(n)) return 'El DNI debe contener solo números';
  if (n.length < 7 || n.length > 8) return 'El DNI debe tener 7 u 8 dígitos';
  return null;
}
function validateCuit(cuit: string): string | null {
  const n = normalizeCuit(cuit);
  if (!/^\d+$/.test(n)) return 'El CUIT debe contener solo números';
  if (n.length !== 11) return 'El CUIT debe tener exactamente 11 dígitos';
  const w = [5,4,3,2,7,6,5,4,3,2];
  const d = n.split('').map(Number);
  const s = w.reduce((a,w,i) => a+w*d[i], 0);
  const r = s % 11;
  const v = r === 0 ? 0 : r === 1 ? 9 : 11 - r;
  if (d[10] !== v) return 'El dígito verificador del CUIT es incorrecto';
  return null;
}
function validateTelefono(tel: string): string | null {
  if (!/^\d+$/.test(tel)) return 'El teléfono debe contener solo números';
  if (tel.length < 8 || tel.length > 15) return 'El teléfono debe tener entre 8 y 15 dígitos';
  return null;
}
function validateDomicilio(dom: string): string | null {
  if (!dom.trim()) return 'El domicilio es obligatorio';
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(dom)) return 'El domicilio debe contener al menos una letra';
  return null;
}

// Fondo animado con partículas SVG
function Background() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-900 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('tipo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [tipoFiscal, setTipoFiscal] = useState<TipoFiscal | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [cuit, setCuit] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function checkUsers() {
      try {
        const res = await api.get('/users/has-users');
        if (!res.data.hasUsers) setMode('register-first');
      } catch {}
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!loginEmail.trim()) { setError('Ingresá tu email'); return; }
    if (!loginPassword) { setError('Ingresá tu contraseña'); return; }
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch { setError('Email o contraseña incorrectos'); }
    finally { setLoading(false); }
  }

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

  function handleTipoNext() {
    if (!tipoFiscal) { setError('Seleccioná tu tipo de contribuyente'); return; }
    setError(''); setStep('datos');
  }

  function handleDatosNext() {
    setError('');
    if (tipoFiscal === 'CONSUMIDOR_FINAL') {
      if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
      if (!apellido.trim()) { setError('Ingresá tu apellido'); return; }
      const e = validateDni(dni); if (e) { setError(e); return; }
      const d = validateDomicilio(domicilio); if (d) { setError(d); return; }
    }
    if (tipoFiscal === 'MONOTRIBUTISTA') {
      if (!nombre.trim()) { setError('Ingresá tu nombre'); return; }
      if (!apellido.trim()) { setError('Ingresá tu apellido'); return; }
      const e = validateDni(dni); if (e) { setError(e); return; }
      const c = validateCuit(cuit); if (c) { setError(c); return; }
      const d = validateDomicilio(domicilio); if (d) { setError(d); return; }
    }
    if (tipoFiscal === 'RESPONSABLE_INSCRIPTO') {
      if (!razonSocial.trim()) { setError('Ingresá la razón social'); return; }
      const c = validateCuit(cuit); if (c) { setError(c); return; }
      const d = validateDomicilio(domicilio); if (d) { setError(d); return; }
    }
    setStep('cuenta');
  }

  async function handleCuentaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresá tu email'); return; }
    const t = validateTelefono(telefono); if (t) { setError(t); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const displayName = tipoFiscal === 'RESPONSABLE_INSCRIPTO' ? razonSocial : nombre;
      await api.post('/users/register', {
        email, name: displayName, password, tipoFiscal,
        apellido: tipoFiscal !== 'RESPONSABLE_INSCRIPTO' ? apellido : undefined,
        dni: tipoFiscal === 'CONSUMIDOR_FINAL' ? normalizeDni(dni) : undefined,
        cuit: tipoFiscal !== 'CONSUMIDOR_FINAL' ? normalizeCuit(cuit) : undefined,
        domicilio, razonSocial: tipoFiscal === 'RESPONSABLE_INSCRIPTO' ? razonSocial : undefined, telefono,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  const cardClass = "relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl";

  // ── LOGIN ──
  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Background />
        <div className={cardClass}>
          {/* Header con logo */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
              <div>
                <h1 className="text-xl font-bold text-white">Distribuidora Gustavo</h1>
                <p className="text-xs text-gray-500">Sistema de gestión comercial</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-1">Bienvenido</h2>
            <p className="text-gray-400 text-sm mb-8">Ingresá tus credenciales para continuar</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setError(''); }}
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                    className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-12"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : 'Ingresar →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700/50 text-center">
              <button
                onClick={() => { resetRegister(); setMode('register'); }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                ¿No tenés cuenta? <span className="font-bold">Registrate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PRIMER ADMIN ──
  if (mode === 'register-first') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Background />
        <div className={cardClass}>
          <div className="px-8 pt-8 pb-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
              <div>
                <h1 className="text-xl font-bold text-white">Distribuidora Gustavo</h1>
                <p className="text-xs text-gray-500">Configuración inicial</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-1">Crear administrador</h2>
            <p className="text-gray-400 text-sm mb-2">Primera configuración del sistema</p>

            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-300 flex items-start gap-2">
              <span className="mt-0.5">ℹ</span>
              <span>No hay usuarios registrados. Creá el primer administrador del sistema.</span>
            </div>

            <form onSubmit={handleRegisterFirst} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Nombre</label>
                <input type="text" placeholder="Ej: Gustavo"
                  value={adminName} onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={loading} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input type="email" placeholder="ejemplo@correo.com"
                  value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={loading} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres"
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  disabled={loading} />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : 'Crear administrador →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── REGISTRO CLIENTE ──
  const stepNumber = step === 'tipo' ? 1 : step === 'datos' ? 2 : 3;
  const stepLabels = ['Tipo fiscal', 'Datos', 'Cuenta'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      <Background />
      <div className={cardClass}>
        <div className="px-8 pt-8 pb-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🏪</div>
              <div>
                <h1 className="text-xl font-bold text-white">Crear cuenta</h1>
                <p className="text-xs text-gray-500">Paso {stepNumber} de 3 — {stepLabels[stepNumber - 1]}</p>
              </div>
            </div>
            <button onClick={() => { setMode('login'); resetRegister(); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors border border-gray-700 px-3 py-1.5 rounded-lg">
              ← Login
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="flex gap-1.5 mt-5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= stepNumber ? 'bg-blue-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          {/* PASO 1 */}
          {step === 'tipo' && (
            <div>
              <p className="text-gray-300 font-bold mb-4">¿Cuál es tu condición fiscal?</p>
              <div className="space-y-3 mb-6">
                {(Object.keys(TIPO_LABELS) as TipoFiscal[]).map((tipo) => (
                  <button key={tipo} type="button"
                    onClick={() => { setTipoFiscal(tipo); setError(''); }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      tipoFiscal === tipo
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <p className="font-bold text-white">{TIPO_LABELS[tipo]}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{TIPO_DESC[tipo]}</p>
                  </button>
                ))}
              </div>
              <button onClick={handleTipoNext} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-colors">
                Continuar →
              </button>
            </div>
          )}

          {/* PASO 2 */}
          {step === 'datos' && tipoFiscal && (
            <div>
              <p className="text-gray-300 font-bold mb-4">Datos de {TIPO_LABELS[tipoFiscal]}</p>
              <div className="space-y-3">
                {tipoFiscal !== 'RESPONSABLE_INSCRIPTO' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Nombre *</label>
                        <input type="text" placeholder="Ej: María" value={nombre}
                          onChange={(e) => { setNombre(e.target.value); setError(''); }}
                          className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Apellido *</label>
                        <input type="text" placeholder="Ej: González" value={apellido}
                          onChange={(e) => { setApellido(e.target.value); setError(''); }}
                          className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">DNI *</label>
                      <input type="text" placeholder="Ej: 38123456" value={dni}
                        onChange={(e) => { setDni(e.target.value); setError(''); }}
                        className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                    </div>
                  </>
                )}
                {tipoFiscal === 'RESPONSABLE_INSCRIPTO' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Razón social *</label>
                    <input type="text" placeholder="Ej: Kiosco Central S.R.L." value={razonSocial}
                      onChange={(e) => { setRazonSocial(e.target.value); setError(''); }}
                      className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                )}
                {tipoFiscal !== 'CONSUMIDOR_FINAL' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">CUIT *</label>
                    <input type="text" placeholder="Ej: 20-38123456-7" value={cuit}
                      onChange={(e) => { setCuit(e.target.value); setError(''); }}
                      className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Domicilio fiscal *</label>
                  <input type="text" placeholder="Ej: Av. Colón 1234" value={domicilio}
                    onChange={(e) => { setDomicilio(e.target.value); setError(''); }}
                    className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setStep('tipo'); setError(''); }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition-colors">← Atrás</button>
                <button type="button" onClick={handleDatosNext}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-colors">Continuar →</button>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 'cuenta' && (
            <form onSubmit={handleCuentaSubmit}>
              <p className="text-gray-300 font-bold mb-4">Datos de tu cuenta</p>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email *</label>
                  <input type="email" placeholder="ejemplo@correo.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                    disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Teléfono *</label>
                  <input type="text" placeholder="Ej: 3511234567" value={telefono}
                    onChange={(e) => { setTelefono(e.target.value); setError(''); }}
                    className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                    disabled={loading} />
                  <p className="text-xs text-gray-600 mt-1">Solo números, sin espacios</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Contraseña * (mín. 6 caracteres)</label>
                  <input type="password" placeholder="••••••••" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-3 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                    disabled={loading} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirmar contraseña *</label>
                  <input type="password" placeholder="••••••••" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    className={`w-full px-3 py-2.5 border rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm ${
                      confirmPassword && confirmPassword !== password
                        ? 'bg-red-900/20 border-red-500/50 focus:border-red-500'
                        : 'bg-gray-800/80 border-gray-700 focus:border-blue-500'
                    }`}
                    disabled={loading} />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setStep('datos'); setError(''); }} disabled={loading}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white transition-colors">← Atrás</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando...
                    </span>
                  ) : 'Crear cuenta ✓'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}