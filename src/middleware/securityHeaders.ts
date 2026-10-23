import { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
<<<<<<< HEAD
    "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:;"
=======
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://airguide-lac.vercel.app https://backend-airguide-production.up.railway.app https://maps.googleapis.com http://localhost:3000 http://localhost:3001;"
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
  );

  // HTTP Strict Transport Security
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
<<<<<<< HEAD
    'geolocation=(self)'
=======
    'camera=(), microphone=(), geolocation=(self)'
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
  );

  res.removeHeader('X-Powered-By');

  next();
};
