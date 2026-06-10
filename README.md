# Distribuidora Gustavo — Frontend

Aplicación web para la gestión integral de la distribuidora: pedidos, clientes, productos, stock, pagos y reportes. Construida con React 19, TypeScript y Vite.

## Tecnologías

- **React 19** + **TypeScript** — UI y tipado estático
- **Vite** — Bundler y servidor de desarrollo
- **React Router DOM** — Enrutamiento client-side
- **Axios** — Cliente HTTP con interceptor de autenticación JWT
- **Tailwind CSS** — Estilos utility-first
- **Recharts** — Gráficos para el dashboard y reportes
- **Nginx** — Servidor de producción (contenedor Docker)

## Requisitos previos

- Node.js 20+
- npm 9+
- Backend corriendo en `http://localhost:3000` (o configurar `VITE_API_URL`)

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Modo desarrollo (con proxy hacia el backend en :3000)
npm run dev

# Build de producción
npm run build

# Previsualizar el build de producción
npm run preview

# Linting
npm run lint
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

En producción con Docker/Nginx, el valor es `/api` y el proxy se encarga del ruteo.

## Estructura del proyecto

```
src/
├── api/
│   └── axios.ts              # Cliente Axios con interceptor Bearer token
├── auth/
│   └── AuthContext.tsx       # Contexto de autenticación, parsing del JWT
├── components/
│   └── ProductSearchSelect.tsx
├── layouts/
│   └── DashboardLayout.tsx   # Layout principal con sidebar y navegación
├── pages/
│   ├── LoginPage.tsx         # Login + registro multi-paso con tipo fiscal
│   ├── DashboardPage.tsx
│   ├── ProductsPage.tsx
│   ├── CustomersPage.tsx
│   ├── OrdersPage.tsx
│   ├── OrdersHistoryPage.tsx
│   ├── MyOrdersPage.tsx      # Vista del cliente (rol CLIENT)
│   ├── PaymentsPage.tsx
│   ├── AccountsPage.tsx
│   ├── StockPage.tsx
│   ├── PurchasesPage.tsx
│   ├── PriceListPage.tsx
│   ├── ReportsPage.tsx
│   └── UsersPage.tsx
├── routes/
│   └── ProtectedRoute.tsx    # Guard de rutas autenticadas
├── App.tsx                   # Definición de rutas
└── main.tsx                  # Punto de entrada
```

## Roles de usuario

| Rol    | Acceso                                                           |
|--------|------------------------------------------------------------------|
| ADMIN  | Acceso completo a todas las secciones                            |
| OWNER  | Gestión de productos, stock, compras, pedidos y clientes         |
| CLIENT | Solo puede ver sus propios pedidos (`/my-orders`)               |

## Autenticación

- Login mediante email + contraseña → devuelve JWT
- Token almacenado en `localStorage`
- Todas las requests incluyen el header `Authorization: Bearer <token>`
- El JWT contiene: `userId`, `email`, `role`
- Registro incluye selección de tipo fiscal argentino:
  - Consumidor Final
  - Monotributista
  - Responsable Inscripto (con validación de CUIT)

## Docker

El frontend usa una build multi-etapa:

```bash
# Construir imagen
docker build -t distribuidora-frontend .

# Correr en puerto 80
docker run -p 80:80 distribuidora-frontend
```

En producción, Nginx:
- Sirve los archivos estáticos del build
- Hace proxy de `/api/*` hacia el backend (`http://backend:3000/`)
- Redirige todas las rutas a `index.html` para el enrutamiento SPA
- Aplica caché de 1 año para assets estáticos
- Habilita compresión gzip