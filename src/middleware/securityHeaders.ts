import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Hardening de Cabeceras HTTP de Seguridad para Airguide API Gateway y Microservicios.
 * Implementa las recomendaciones de la OWASP Secure Headers Project.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // 1. Content Security Policy (CSP): Mitiga XSS y Data Injection
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://airguide-lac.vercel.app http://localhost:3001;"
  );

  // 2. HTTP Strict Transport Security (HSTS): Enforza HTTPS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // 3. X-Frame-Options: Evita ataques de Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // 4. X-Content-Type-Options: Evita el MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 5. Referrer-Policy: Controla la información transmitida en el encabezado Referer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Permissions-Policy: Restringe características sensibles del navegador
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  );

  // Remueve la cabecera X-Powered-By para evitar el recon de stack de software
  res.removeHeader('X-Powered-By');

  next();
};
