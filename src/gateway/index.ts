import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
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

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[GATEWAY] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'API Gateway' });
});

// Proxies a microservicios
app.use('/api/auth', createProxyMiddleware({ target: AUTH_URL, changeOrigin: true, pathRewrite: {'^/api/auth': ''} }));
app.use('/api/edificios', createProxyMiddleware({ target: BUILDINGS_URL, changeOrigin: true, pathRewrite: {'^/api/edificios': ''} }));
app.use('/api/profesores', createProxyMiddleware({ target: `${BUILDINGS_URL}/profesores`, changeOrigin: true, pathRewrite: {'^/api/profesores': ''} }));
app.use('/api/productos', createProxyMiddleware({ target: `${BUILDINGS_URL}/productos`, changeOrigin: true, pathRewrite: {'^/api/productos': ''} }));
app.use('/api/ventas', createProxyMiddleware({ target: `${BUILDINGS_URL}/ventas`, changeOrigin: true, pathRewrite: {'^/api/ventas': ''} }));
app.use('/api/eventos', createProxyMiddleware({ target: EVENTS_URL, changeOrigin: true, pathRewrite: {'^/api/eventos': ''} }));
app.use('/api/rutas', createProxyMiddleware({ target: NAVIGATION_URL, changeOrigin: true, pathRewrite: {'^/api/rutas': ''} }));
app.use('/api/mapa', createProxyMiddleware({ target: `${NAVIGATION_URL}/mapa`, changeOrigin: true, pathRewrite: {'^/api/mapa': ''} }));
app.use('/api/google', createProxyMiddleware({ target: `${NAVIGATION_URL}/google`, changeOrigin: true, pathRewrite: {'^/api/google': ''} }));
app.use('/api/analytics', createProxyMiddleware({ target: ANALYTICS_URL, changeOrigin: true, pathRewrite: {'^/api/analytics': ''} }));
app.use('/api/docentes', createProxyMiddleware({ target: DOCENTES_URL, changeOrigin: true, pathRewrite: {'^/api/docentes': ''} }));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
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
});

// 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Ruta de Gateway no encontrada' });
});

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

