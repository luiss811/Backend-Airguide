import { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://airguide-lac.vercel.app http://localhost:3001;"
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
    'camera=(), microphone=(), geolocation=(self)'
  );

  res.removeHeader('X-Powered-By');

  next();
};
