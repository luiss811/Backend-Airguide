import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
<<<<<<< HEAD
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { securityHeaders } from '../middleware/securityHeaders.js';
import { securityLogger } from '../middleware/securityLogger.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
// Configuración de URLs de microservicios (soporta contenedores independientes o colocalizados)
const AUTH_URL = process.env.AUTH_SERVICE_URL || `http://localhost:${process.env.PORT_AUTH || 3011}`;
const BUILDINGS_URL = process.env.BUILDINGS_SERVICE_URL || `http://localhost:${process.env.PORT_BUILDINGS || 3012}`;
const EVENTS_URL = process.env.EVENTS_SERVICE_URL || `http://localhost:${process.env.PORT_EVENTS || 3013}`;
const NAVIGATION_URL = process.env.NAVIGATION_SERVICE_URL || `http://localhost:${process.env.PORT_NAVIGATION || process.env.PORT_NAV || 3014}`;
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || `http://localhost:${process.env.PORT_ANALYTICS || 3015}`;
const DOCENTES_URL = process.env.DOCENTES_SERVICE_URL || `http://localhost:${process.env.PORT_DOCENTES || process.env.PORT_PROFESORES || 3016}`;
const corsOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://airguide-lac.vercel.app',
    process.env.CORS_ORIGIN,
].filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
};
app.use(securityHeaders);
app.use(securityLogger);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
const frontendPath = path.join(__dirname, '../../../dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
}
=======
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const corsOptions = {
    origin: [
        'https://*',
        'http://localhost:5173',
        'https://airguide-lac.vercel.app',
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
// Handle OPTIONS preflight for all routes BEFORE proxies
app.options('*', cors(corsOptions));
// Servir frontend static si estamos en producción
const frontendPath = path.join(__dirname, '../../../dist');
app.use(express.static(frontendPath));
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
<<<<<<< HEAD
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'API Gateway' });
});
// Proxies a microservicios
app.use('/api/auth', createProxyMiddleware({ target: AUTH_URL, changeOrigin: true, pathRewrite: { '^/api/auth': '' } }));
app.use('/api/edificios', createProxyMiddleware({ target: BUILDINGS_URL, changeOrigin: true, pathRewrite: { '^/api/edificios': '' } }));
app.use('/api/profesores', createProxyMiddleware({ target: `${BUILDINGS_URL}/profesores`, changeOrigin: true, pathRewrite: { '^/api/profesores': '' } }));
app.use('/api/productos', createProxyMiddleware({ target: `${BUILDINGS_URL}/productos`, changeOrigin: true, pathRewrite: { '^/api/productos': '' } }));
app.use('/api/ventas', createProxyMiddleware({ target: `${BUILDINGS_URL}/ventas`, changeOrigin: true, pathRewrite: { '^/api/ventas': '' } }));
app.use('/api/eventos', createProxyMiddleware({ target: EVENTS_URL, changeOrigin: true, pathRewrite: { '^/api/eventos': '' } }));
app.use('/api/rutas', createProxyMiddleware({ target: NAVIGATION_URL, changeOrigin: true, pathRewrite: { '^/api/rutas': '' } }));
app.use('/api/mapa', createProxyMiddleware({ target: `${NAVIGATION_URL}/mapa`, changeOrigin: true, pathRewrite: { '^/api/mapa': '' } }));
app.use('/api/google', createProxyMiddleware({ target: `${NAVIGATION_URL}/google`, changeOrigin: true, pathRewrite: { '^/api/google': '' } }));
app.use('/api/analytics', createProxyMiddleware({ target: ANALYTICS_URL, changeOrigin: true, pathRewrite: { '^/api/analytics': '' } }));
app.use('/api/docentes', createProxyMiddleware({ target: DOCENTES_URL, changeOrigin: true, pathRewrite: { '^/api/docentes': '' } }));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/'))
        return next();
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    return res.json({
        status: 'ok',
        message: 'AirGuide API Gateway activo',
        service: 'API Gateway',
        timestamp: new Date().toISOString(),
    });
=======
// HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'API Gateway' });
});
// Proxies
app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:3011', changeOrigin: true, pathRewrite: { '^/api/auth': '' } }));
app.use('/api/edificios', createProxyMiddleware({ target: 'http://localhost:3012', changeOrigin: true, pathRewrite: { '^/api/edificios': '' } }));
app.use('/api/profesores', createProxyMiddleware({ target: 'http://localhost:3012/profesores', changeOrigin: true, pathRewrite: { '^/api/profesores': '' } }));
app.use('/api/eventos', createProxyMiddleware({ target: 'http://localhost:3013', changeOrigin: true, pathRewrite: { '^/api/eventos': '' } }));
app.use('/api/rutas', createProxyMiddleware({ target: 'http://localhost:3014', changeOrigin: true, pathRewrite: { '^/api/rutas': '' } }));
app.use('/api/mapa', createProxyMiddleware({ target: 'http://localhost:3014/mapa', changeOrigin: true, pathRewrite: { '^/api/mapa': '' } }));
app.use('/api/google', createProxyMiddleware({ target: 'http://localhost:3014/google', changeOrigin: true, pathRewrite: { '^/api/google': '' } }));
app.use('/api/analytics', createProxyMiddleware({ target: 'http://localhost:3015', changeOrigin: true, pathRewrite: { '^/api/analytics': '' } }));
app.use('/api/docentes', createProxyMiddleware({ target: 'http://localhost:3016', changeOrigin: true, pathRewrite: { '^/api/docentes': '' } }));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/'))
        return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
});
// 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta de Gateway no encontrada' });
});
<<<<<<< HEAD
/* v8 ignore start */
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`
      |----------------------------------------------------------------|
      |                                                                |
      |    AirGuide API Gateway                                        |
      |                                                                |
      |     Listening on PORT: ${PORT}                                    |
      |----------------------------------------------------------------|
    `);
    });
}
/* v8 ignore stop */
export { app };
=======
app.listen(PORT, () => {
    console.log(`
    |----------------------------------------------------------------|
    |                                                                |
    |    AirGuide API Gateway                                        |
    |                                                                |
    |     Listening on PORT: ${PORT}                                    |
    |----------------------------------------------------------------|
  `);
});
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
//# sourceMappingURL=index.js.map