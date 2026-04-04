import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://airguide-lac.vercel.app',
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Servir frontend static si estamos en producción
const frontendPath = path.join(__dirname, '../../../dist');
app.use(express.static(frontendPath));
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
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
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/'))
        return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
});
// 404
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta de Gateway no encontrada' });
});
app.listen(PORT, () => {
    console.log(`
    |----------------------------------------------------------------|
    |                                                                |
    |    AirGuide API Gateway (Microservices)                        |
    |                                                                |
    |     Listening on PORT: ${PORT}                                    |
    |----------------------------------------------------------------|
  `);
});
//# sourceMappingURL=index.js.map