import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { securityHeaders } from '../middleware/securityHeaders.js';
import { securityLogger } from '../middleware/securityLogger.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT;
const corsOptions = {
    origin: ['http://localhost:5173',
        'https://airguide-lac.vercel.app',
    ],
    credentials: true,
};
app.use(securityHeaders);
app.use(securityLogger);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
const frontendPath = path.join(__dirname, '../../../dist');
app.use(express.static(frontendPath));
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'API Gateway' });
});
// Proxies
app.use('/api/auth', createProxyMiddleware({ target: 'http://localhost:3011', changeOrigin: true, pathRewrite: { '^/api/auth': '' } }));
app.use('/api/edificios', createProxyMiddleware({ target: 'http://localhost:3012', changeOrigin: true, pathRewrite: { '^/api/edificios': '' } }));
app.use('/api/profesores', createProxyMiddleware({ target: 'http://localhost:3012/profesores', changeOrigin: true, pathRewrite: { '^/api/profesores': '' } }));
app.use('/api/productos', createProxyMiddleware({ target: 'http://localhost:3012/productos', changeOrigin: true, pathRewrite: { '^/api/productos': '' } }));
app.use('/api/ventas', createProxyMiddleware({ target: 'http://localhost:3012/ventas', changeOrigin: true, pathRewrite: { '^/api/ventas': '' } }));
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
//# sourceMappingURL=index.js.map