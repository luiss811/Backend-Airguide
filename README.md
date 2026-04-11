# UniRoute Backend API

Backend Microservicios Airguide, construida con Node.js, Express y Prisma.

## Tecnologías

- **Node.js v22** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma ORM** - Object-Relational Mapping
- **TypeScript** - Tipado estático
- **JWT** - Autenticación con tokens
- **Bcrypt** - Hash de contraseñas
- **Zod** - Validación de esquemas

## Requisitos Previos

- Node.js v22 o superior
- npm o pnpm

## Instalación

### 1. Instalar dependencias

```bash
cd Backend-Airguide
npm install --legacy-peer-deps
```

### 2. Configurar variables de entorno

Crea el archivo `.env`:

```env
  DATABASE_URL="postgres://95f5f1214a82708148a9b43e39fa1e41e4060e963ee217d0c4174044af1541f9:sk_XYgJ7P5CcF3TPpb0XVgW0@pooled.db.prisma.io:5432/postgres?sslmode=require"

  #URL DEVELOPMENT  http://localhost:3001/api || https://airguide-lac.vercel.app
  API_URL="http://localhost:3001/api"
  API_KEY="AIzaSyBCORaDyk1go3cDfKQNSM9-CS8wv12GSJM"
  # Server
  NODE_ENV="development"
  # JWT
  JWT_SECRET="67c87664b5bba0c8746a21b017b4ea71"
  JWT_EXPIRES_IN="1d"

  # CORS http://localhost:5173
  CORS_ORIGIN="http://localhost:5173"

  # Email / SMTP (for 2FA OTP)
  # Gmail example: use an App Password (not your account password)
  # Generate one at: https://myaccount.google.com/apppasswords
  SMTP_HOST="smtp.gmail.com"
  SMTP_PORT="587"
  SMTP_SECURE="false"
  SMTP_USER="lalitorios81@gmail.com"
  SMTP_PASS="yxyx dcqh nqag nant"
  SMTP_FROM="AirGuide <lalitorios81@gmail.com>"
```

### 3. Ejecutar migraciones de Prisma

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar la base de datos con datos de ejemplo
npm run prisma:seed
```

### 4. Iniciar el servidor

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm run build
npm start
```

El servidor estará disponible en `http://localhost:3001`

### Roles de Usuario

- **USER**: Puede ver rutas y eventos, registrar uso de rutas
- **ADMIN**: Todos los permisos de USER + CRUD de rutas/eventos + analytics

## Esquema de Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema
- **routes**: Rutas de navegación
- **events**: Eventos universitarios
- **route_usage**: Registro de uso de rutas (para analytics)

Ver detalles completos en `/prisma/schema.prisma`

## Scripts Disponibles

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

## Prisma Studio

Para explorar y editar la base de datos visualmente:

```bash
npm run prisma:studio
```

Se abrirá en `http://localhost:5555`

## Deployment

### Variables de Entorno Requeridas en Producción

```env
  DATABASE_URL="postgres://95f5f1214a82708148a9b43e39fa1e41e4060e963ee217d0c4174044af1541f9:sk_XYgJ7P5CcF3TPpb0XVgW0@pooled.db.prisma.io:5432/postgres?sslmode=require"

  #URL DEVELOPMENT  http://localhost:3001/api || https://airguide-lac.vercel.app
  API_URL="http://localhost:3001/api"
  API_KEY="AIzaSyBCORaDyk1go3cDfKQNSM9-CS8wv12GSJM"
  # Server
  NODE_ENV="development"
  # JWT
  JWT_SECRET="67c87664b5bba0c8746a21b017b4ea71"
  JWT_EXPIRES_IN="1d"

  # CORS http://localhost:5173
  CORS_ORIGIN="http://localhost:5173"

  # Email / SMTP (for 2FA OTP)
  # Gmail example: use an App Password (not your account password)
  # Generate one at: https://myaccount.google.com/apppasswords
  SMTP_HOST="smtp.gmail.com"
  SMTP_PORT="587"
  SMTP_SECURE="false"
  SMTP_USER="lalitorios81@gmail.com"
  SMTP_PASS="yxyx dcqh nqag nant"
  SMTP_FROM="AirGuide <lalitorios81@gmail.com>"

```
---

**Desarrollado por Airguide **
