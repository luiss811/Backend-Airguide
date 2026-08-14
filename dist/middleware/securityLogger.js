/**
 * Middleware de Seguridad (Logging).
 * Registra intentos fallidos de autenticacion, errores 4xx/5xx y accesos a rutas importantes.
 */
export const securityLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const ip = req.ip || req.socket.remoteAddress;
        if (statusCode === 401 || statusCode === 403) {
            console.warn(`[SECURITY ALERT - AUTH FAILURE] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode}`);
        }
        else if (statusCode >= 400 && statusCode < 500) {
            console.warn(`[SECURITY EVENT - CLIENT ERROR 4XX] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode}`);
        }
        else if (statusCode >= 500) {
            console.error(`[SECURITY EVENT - SERVER ERROR 5XX] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode}`);
        }
        else {
            console.log(`[ACCESS LOG] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode} | ${duration}ms`);
        }
    });
    next();
};
//# sourceMappingURL=securityLogger.js.map