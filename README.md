# UniRoute Backend API

API RESTful para el sistema de navegación universitaria UniRoute, construida con Node.js, Express, Prisma y MySQL 8.

## 🚀 Tecnologías

- **Node.js v22** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma ORM** - Object-Relational Mapping
- **MySQL 8** - Base de datos
- **TypeScript** - Tipado estático
- **JWT** - Autenticación con tokens
- **Bcrypt** - Hash de contraseñas
- **Zod** - Validación de esquemas

## 📋 Requisitos Previos

- Node.js v22 o superior
- MySQL 8.0 o superior
- npm o pnpm

## 🔧 Instalación

### 1. Instalar dependencias

```bash
cd server
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
# Database
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/uniroute"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambia-esto
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Configurar MySQL

Crea la base de datos en MySQL:

```sql
CREATE DATABASE uniroute CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Ejecutar migraciones de Prisma

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar la base de datos con datos de ejemplo
npm run prisma:seed
```

### 5. Iniciar el servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📚 API Endpoints

### Autenticación

#### POST /api/auth/register
Registrar nuevo usuario

**Request Body:**
```json
{
  "email": "usuario@universidad.edu",
  "password": "password123",
  "name": "Nombre Usuario"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "usuario@universidad.edu",
    "name": "Nombre Usuario",
    "role": "USER"
  }
}
```

#### POST /api/auth/login
Iniciar sesión

**Request Body:**
```json
{
  "email": "admin@universidad.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@universidad.edu",
    "name": "Admin Usuario",
    "role": "ADMIN"
  }
}
```

#### GET /api/auth/me
Obtener usuario actual (requiere autenticación)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "usuario@universidad.edu",
  "name": "Nombre Usuario",
  "role": "USER",
  "createdAt": "2026-03-01T00:00:00.000Z"
}
```

### Rutas

#### GET /api/routes
Obtener todas las rutas

**Query Parameters:**
- `status` (opcional): `ACTIVE` | `INACTIVE`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Ruta a Biblioteca Central",
    "description": "Camino principal desde la entrada...",
    "category": "Edificios",
    "status": "ACTIVE",
    "coordinates": [[4.6382, -74.0836], [4.6385, -74.0838]],
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z"
  }
]
```

#### GET /api/routes/:id
Obtener una ruta específica

#### POST /api/routes
Crear nueva ruta (requiere rol ADMIN)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Nueva Ruta",
  "description": "Descripción de la ruta",
  "category": "Edificios",
  "status": "ACTIVE",
  "coordinates": [[4.6382, -74.0836], [4.6385, -74.0838]]
}
```

#### PUT /api/routes/:id
Actualizar ruta (requiere rol ADMIN)

#### DELETE /api/routes/:id
Eliminar ruta (requiere rol ADMIN)

#### POST /api/routes/:id/track
Registrar uso de una ruta (requiere autenticación)

### Eventos

#### GET /api/events
Obtener todos los eventos

**Query Parameters:**
- `status` (opcional): `ACTIVE` | `INACTIVE` | `CANCELLED`

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Feria Universitaria de Ciencias",
    "description": "Exposición anual de proyectos...",
    "date": "2026-03-15T09:00:00.000Z",
    "location": "Auditorio Principal",
    "status": "ACTIVE",
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z"
  }
]
```

#### GET /api/events/:id
Obtener un evento específico

#### POST /api/events
Crear nuevo evento (requiere rol ADMIN)

**Request Body:**
```json
{
  "title": "Nuevo Evento",
  "description": "Descripción del evento",
  "date": "2026-04-15T10:00:00.000Z",
  "location": "Ubicación del evento",
  "status": "ACTIVE"
}
```

#### PUT /api/events/:id
Actualizar evento (requiere rol ADMIN)

#### DELETE /api/events/:id
Eliminar evento (requiere rol ADMIN)

### Analytics

Todos los endpoints de analytics requieren autenticación y rol ADMIN.

#### GET /api/analytics/dashboard
Obtener estadísticas del dashboard

**Response:**
```json
{
  "totalRoutes": 6,
  "activeRoutes": 5,
  "totalEvents": 6,
  "activeEvents": 5,
  "totalUsers": 2,
  "totalRouteUsage": 100
}
```

#### GET /api/analytics/routes-usage
Obtener uso de rutas (top 10)

**Response:**
```json
[
  {
    "routeId": "uuid",
    "name": "Ruta a Biblioteca Central",
    "category": "Edificios",
    "count": 25
  }
]
```

#### GET /api/analytics/routes-timeline
Obtener uso de rutas por día

**Query Parameters:**
- `days` (opcional, default: 30): número de días a consultar

**Response:**
```json
[
  {
    "date": "2026-03-01",
    "count": 15
  }
]
```

#### GET /api/analytics/category-distribution
Obtener distribución por categoría

**Response:**
```json
[
  {
    "category": "Edificios",
    "active": 3,
    "inactive": 1,
    "total": 4
  }
]
```

#### GET /api/analytics/events-timeline
Obtener línea de tiempo de eventos

**Response:**
```json
[
  {
    "month": "2026-03",
    "active": 4,
    "inactive": 0,
    "cancelled": 1,
    "total": 5
  }
]
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. 

Para acceder a endpoints protegidos:

1. Obtén un token mediante login o registro
2. Incluye el token en el header `Authorization`:

```
Authorization: Bearer <tu-token-aqui>
```

### Roles de Usuario

- **USER**: Puede ver rutas y eventos, registrar uso de rutas
- **ADMIN**: Todos los permisos de USER + CRUD de rutas/eventos + analytics

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema
- **routes**: Rutas de navegación
- **events**: Eventos universitarios
- **route_usage**: Registro de uso de rutas (para analytics)

Ver detalles completos en `/prisma/schema.prisma`

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor en modo desarrollo

# Producción
npm run build            # Compila TypeScript a JavaScript
npm start                # Inicia servidor compilado

# Prisma
npm run prisma:generate  # Genera cliente de Prisma
npm run prisma:migrate   # Ejecuta migraciones
npm run prisma:studio    # Abre Prisma Studio (GUI)
npm run prisma:seed      # Pobla la base de datos
```

## 📊 Prisma Studio

Para explorar y editar la base de datos visualmente:

```bash
npm run prisma:studio
```

Se abrirá en `http://localhost:5555`

## 🔍 Testing

### Usuarios de Prueba

El seed crea estos usuarios automáticamente:

**Administrador:**
- Email: `admin@universidad.edu`
- Password: `password123`
- Role: `ADMIN`

**Usuario Regular:**
- Email: `usuario@universidad.edu`
- Password: `password123`
- Role: `USER`

### Test Manual con cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@universidad.edu","password":"password123"}'

# Obtener rutas
curl http://localhost:3001/api/routes

# Crear ruta (con token)
curl -X POST http://localhost:3001/api/routes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{"name":"Test","description":"Test route","category":"Test","coordinates":[[4.6,74.0],[4.7,74.1]]}'
```

## 🐛 Debugging

### Ver logs de Prisma

Edita `src/lib/prisma.ts` para habilitar más logs:

```typescript
log: ['query', 'error', 'warn', 'info']
```

### Variables de entorno para debugging

```env
NODE_ENV=development
DEBUG=*
```

## 📝 Notas Importantes

1. **Seguridad**: Cambia el `JWT_SECRET` en producción
2. **CORS**: Ajusta `CORS_ORIGIN` según tu frontend
3. **Base de datos**: Haz backups regulares
4. **Migraciones**: Revisa las migraciones antes de aplicarlas en producción

## 🚀 Deployment

### Variables de Entorno Requeridas en Producción

```env
DATABASE_URL=mysql://user:pass@host:3306/dbname
PORT=3001
NODE_ENV=production
JWT_SECRET=<secreto-muy-seguro>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://tu-dominio.com
```

## 📄 Licencia

MIT

---

**Desarrollado para UniRoute - Sistema de Navegación Universitaria**
