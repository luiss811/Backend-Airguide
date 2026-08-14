export const securityHeaders = (req, res, next) => {
    // Content Security Policy (CSP)
    res.setHeader('Content-Security-Policy', "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:;");
    // HTTP Strict Transport Security
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions-Policy
    res.setHeader('Permissions-Policy', 'geolocation=(self)');
    res.removeHeader('X-Powered-By');
    next();
};
//# sourceMappingURL=securityHeaders.js.map