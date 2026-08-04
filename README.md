# Airguide — Backend API & Microservices

Servidor de Microservicios y API Gateway para la plataforma **Airguide**, construido con Node.js, Express, TypeScript, Prisma ORM y PostgreSQL.

---

## Arquitectura de Microservicios

| Servicio | Descripción |
|---|---|---|
| **API Gateway** | Punto único de entrada, manejo de CORS, hardening de cabeceras HTTP y proxy inverso. |
| **Auth Service** | Registro, inicio de sesión, verificación 2FA (OTP) y gestión de tokens JWT. |
| **Buildings Service** | Gestión de catálogo de edificios, salones, profesores y cubículos. |
| **Events Service** | Creación, consulta, filtrado de eventos universitarios y entrenamiento neuronal. |
| **Navigation Service** | Cálculo de rutas del campus y servicios de geolocalización. |
| **Analytics Service** | Métricas de uso de rutas, estadísticas del dashboard y reportes. |
| **Docentes Service** | Consulta y asignación de horarios de docentes. |

---

## Tecnologías Principales

- **Runtime:** Node.js v22+
- **Framework Web:** Express
- **ORM & BD:** Prisma ORM + PostgreSQL
- **Tipado Estático:** TypeScript
- **Autenticación & Cifrado:** JWT (JSON Web Tokens), Bcryptjs (Hashing de contraseñas con sal)
- **Validación:** Zod
- **Seguridad & Hardening:** Middleware de cabeceras HTTP de seguridad (CSP, HSTS, X-Frame-Options) y logger de auditoría.

---

## Aclaraciones:

El backend de Airguide implementa una arquitectura distribuida basada en microservicios orquestados por un API Gateway centralizado. Administra la autenticación de usuarios, la gestión de la infraestructura física de la universidad (edificios, salones, cubículos), la programación de eventos, la generación de rutas óptimas para navegar y la recolección de analíticas del sistema.

---

## Pasos para correr el proyecto

### 1. Clonar los Repositorios

Debes clonar tanto el repositorio del Frontend como el del Backend:

```bash
# Frontend
git clone https://github.com/luiss811/Airguide.git

# Backend
git clone https://github.com/luiss811/Backend-Airguide.git
```

### 2. Abre la terminal en Visual Studio Code
En la rama principal ``` \Airguide> ``` 

Ejecuta el comando 
```bash
npm install --legacy-peer-deps 
```
. Tardara unos minutos. Cuando finalice, abre una nueva terminal en Visual Studio Code y navega hacia el backend. ``` cd Backend-Airguide ```

Servidor Backend
En la rama del servidor ``` \Backend-Airguide> ```

Ejecuta el comando 
```bash 
npm install --legacy-peer-deps
```

### 3. Instalación de Dependencias del Frontend

Navega a la carpeta `Airguide`:

```bash
cd Airguide
npm install --legacy-peer-deps
```

### 4. Configuración de Variables de Entorno (.env)

### 5. Ahora sí, en la terminal del servidor backend (Terminal 2), ejecuta el comando 
```bash 
npm run dev
```
. Eso debe de inciar el servidor.

### 6. En la terminal del frontend (Terminal 1), ejecuta el comando 
```bash 
npm run dev
```
. Eso debe de inciar el frontend.

---

## Inicialización de Base de Datos (Prisma)

```bash
# 1. Generar cliente de Prisma
npm run prisma:generate

# 2. Aplicar migraciones a la base de datos
npm run prisma:migrate

# 3. Poblar la base de datos con datos de prueba
npm run prisma:seed
```

---

## Ejecución del Servidor

```bash
# Modo Desarrollo
npm run dev

# Modo Producción
npm run build
npm start
```

---

## Medidas de Seguridad Implementadas

- **Gestión de Secretos:** Credenciales 100% aisladas mediante variables de entorno `.env`.
- **Cabeceras HTTP Seguras:** Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`).
- **Logging de Seguridad:** Registro de intentos fallidos de autenticación y errores 4xx/5xx (`securityLogger.ts`).
- **Defensa en Profundidad:** Sanitización de entrada con Zod y hashing de contraseñas con bcrypt (salt 10).

---

Desarrollado por el equipo **Airguide** | Todos los derechos reservados.
