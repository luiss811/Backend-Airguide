import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Registración (Logging) de Eventos de Seguridad.
 * Registra intentos fallidos de autenticación, errores 4xx/5xx y acceso a rutas críticas.
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const ip = req.ip || req.socket.remoteAddress;

    // Detectar eventos anómalos o de seguridad
    if (statusCode === 401 || statusCode === 403) {
      console.warn(`[SECURITY ALERT - AUTH FAILURE] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode}`);
    } else if (statusCode >= 400 && statusCode < 500) {
      console.warn(`[SECURITY EVENT - CLIENT ERROR 4XX] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode}`);
    } else if (statusCode >= 500) {
      console.error(`[SECURITY EVENT - SERVER ERROR 5XX] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode}`);
    } else {
      console.log(`[ACCESS LOG] ${new Date().toISOString()} | IP: ${ip} | Method: ${req.method} | Path: ${req.path} | Status: ${statusCode} | ${duration}ms`);
    }
  });

  next();
};
