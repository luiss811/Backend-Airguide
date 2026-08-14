import { describe, it, expect, vi } from 'vitest';
import { securityHeaders } from './securityHeaders.js';
import { securityLogger } from './securityLogger.js';
import { authenticate, requireAdmin, requireProfesor } from './auth.middleware.js';
import { generateToken } from '../lib/jwt.js';
import * as jwtLib from '../lib/jwt.js';
describe('Middleware Utilities', () => {
    it('securityHeaders sets security headers on response', () => {
        const req = {};
        const res = { setHeader: vi.fn(), removeHeader: vi.fn() };
        const next = vi.fn();
        securityHeaders(req, res, next);
        expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
        expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
        expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
        expect(next).toHaveBeenCalled();
    });
    it('securityLogger logs 2xx, 4xx and 5xx status codes', () => {
        const req = { ip: '127.0.0.1', method: 'GET', path: '/test' };
        const res = { statusCode: 200, on: vi.fn((event, cb) => cb()) };
        const next = vi.fn();
        securityLogger(req, res, next);
        expect(next).toHaveBeenCalled();
        const res4xx = { statusCode: 400, on: vi.fn((event, cb) => cb()) };
        securityLogger(req, res4xx, next);
        const res5xx = { statusCode: 500, on: vi.fn((event, cb) => cb()) };
        securityLogger(req, res5xx, next);
    });
    describe('Auth Middleware', () => {
        it('authenticate attaches user when valid token provided', async () => {
            const token = generateToken({ userId: '1', email: 'test@example.com', role: 'admin' });
            const req = { headers: { authorization: `Bearer ${token}` } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
            const next = vi.fn();
            await authenticate(req, res, next);
            expect(req.user).toBeDefined();
            expect(req.user.userId).toBe('1');
            expect(next).toHaveBeenCalled();
        });
        it('authenticate returns 401 when token missing or header invalid', async () => {
            const req = { headers: {} };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
            const next = vi.fn();
            await authenticate(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            const reqInvalidHeader = { headers: { authorization: 'Basic 123' } };
            await authenticate(reqInvalidHeader, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
        });
        it('authenticate returns 401 when verifyToken returns null or throws exception', async () => {
            const req = { headers: { authorization: 'Bearer invalidtoken' } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
            const next = vi.fn();
            const verifySpy = vi.spyOn(jwtLib, 'verifyToken').mockReturnValueOnce(null);
            await authenticate(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
            verifySpy.mockImplementationOnce(() => { throw new Error('JWT Exception'); });
            await authenticate(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'No autorizado' });
            verifySpy.mockRestore();
        });
        it('requireAdmin allows admin role and blocks non-admin', () => {
            const reqAdmin = { user: { role: 'admin' } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
            const next = vi.fn();
            requireAdmin(reqAdmin, res, next);
            expect(next).toHaveBeenCalled();
            const reqUser = { user: { role: 'alumno' } };
            requireAdmin(reqUser, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
        it('requireProfesor allows profesor role and blocks non-profesor', () => {
            const reqProf = { user: { role: 'profesor' } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
            const next = vi.fn();
            requireProfesor(reqProf, res, next);
            expect(next).toHaveBeenCalled();
            const reqUser = { user: { role: 'alumno' } };
            requireProfesor(reqUser, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});
//# sourceMappingURL=middleware.test.js.map