import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcryptjs';
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        usuario: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        codigoOtp: {
            updateMany: vi.fn(),
            create: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        logAcceso: {
            create: vi.fn(),
        },
        $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
    },
}));
vi.mock('../../lib/email.js', () => ({
    sendOtpEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
describe('Auth Service', () => {
    let app;
    let adminToken;
    beforeEach(async () => {
        vi.clearAllMocks();
        const { app: expressApp } = await import('./index.js');
        app = expressApp;
        const { generateToken } = await import('../../lib/jwt.js');
        adminToken = generateToken({ userId: '1', email: 'admin@airguide.com', role: 'admin' });
    });
    describe('POST /login', () => {
        it('returns 400 on Zod error', async () => {
            const res = await request(app).post('/login').send({ correo: 'bad-email' });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });
        it('returns 401 if user not found', async () => {
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res = await request(app).post('/login').send({ correo: 'user@test.com', password: 'password123' });
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Credenciales incorrectas');
        });
        it('returns 403 if user is not active', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ estado: 'pendiente' });
            const res = await request(app).post('/login').send({ correo: 'user@test.com', password: 'password123' });
            expect(res.status).toBe(403);
        });
        it('returns 401 on invalid password', async () => {
            prisma.usuario.findUnique.mockResolvedValue({
                id_usuario: 1,
                correo: 'user@test.com',
                estado: 'activo',
                password_hash: await bcrypt.hash('realpass123', 10),
            });
            const res = await request(app).post('/login').send({ correo: 'user@test.com', password: 'wrongpassword' });
            expect(res.status).toBe(401);
        });
        it('returns 200 and sends OTP on correct credentials', async () => {
            const hash = await bcrypt.hash('password123', 10);
            prisma.usuario.findUnique.mockResolvedValue({
                id_usuario: 1,
                correo: 'user@test.com',
                nombre: 'Juan',
                estado: 'activo',
                password_hash: hash,
            });
            const res = await request(app).post('/login').send({ correo: 'user@test.com', password: 'password123' });
            expect(res.status).toBe(200);
            expect(res.body.requiresTwoFactor).toBe(true);
            expect(prisma.codigoOtp.create).toHaveBeenCalled();
        });
        it('returns 500 on unexpected internal server error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).post('/login').send({ correo: 'user@test.com', password: 'password123' });
            expect(res.status).toBe(500);
        });
    });
    describe('POST /verify-2fa', () => {
        it('returns 400 if missing parameters', async () => {
            const res = await request(app).post('/verify-2fa').send({ correo: 'user@test.com' });
            expect(res.status).toBe(400);
        });
        it('returns 401 if user not found', async () => {
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res = await request(app).post('/verify-2fa').send({ correo: 'user@test.com', codigo: '123456' });
            expect(res.status).toBe(401);
        });
        it('returns 401 if OTP record is missing or expired', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, correo: 'user@test.com' });
            prisma.codigoOtp.findFirst.mockResolvedValue(null);
            const res = await request(app).post('/verify-2fa').send({ correo: 'user@test.com', codigo: '123456' });
            expect(res.status).toBe(401);
        });
        it('returns 200 with JWT token on valid 2FA code', async () => {
            prisma.usuario.findUnique.mockResolvedValue({
                id_usuario: 1,
                correo: 'user@test.com',
                nombre: 'Juan',
                matricula: '12345',
                rol: 'alumno',
                prioridad: 4,
                estado: 'activo',
            });
            prisma.codigoOtp.findFirst.mockResolvedValue({ id: 10, codigo: '123456' });
            const res = await request(app).post('/verify-2fa').send({ correo: 'user@test.com', codigo: '123456' });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(prisma.logAcceso.create).toHaveBeenCalled();
        });
        it('returns 500 on internal server error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('Internal Exception'));
            const res = await request(app).post('/verify-2fa').send({ correo: 'user@test.com', codigo: '123456' });
            expect(res.status).toBe(500);
        });
    });
    describe('POST /resend-otp', () => {
        it('returns 400 if email is missing', async () => {
            const res = await request(app).post('/resend-otp').send({});
            expect(res.status).toBe(400);
        });
        it('returns generic success message if user does not exist or is inactive', async () => {
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res = await request(app).post('/resend-otp').send({ correo: 'unknown@test.com' });
            expect(res.status).toBe(200);
        });
        it('sends new OTP for active user', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, correo: 'user@test.com', nombre: 'Juan', estado: 'activo' });
            const res = await request(app).post('/resend-otp').send({ correo: 'user@test.com' });
            expect(res.status).toBe(200);
            expect(prisma.codigoOtp.create).toHaveBeenCalled();
        });
        it('returns 500 on internal error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('Err'));
            const res = await request(app).post('/resend-otp').send({ correo: 'user@test.com' });
            expect(res.status).toBe(500);
        });
    });
    describe('POST /register', () => {
        it('returns 400 on Zod error', async () => {
            const res = await request(app).post('/register').send({ correo: 'invalid' });
            expect(res.status).toBe(400);
        });
        it('returns 400 if email already exists', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1 });
            const res = await request(app).post('/register').send({
                correo: 'existing@mail.com',
                password: 'password123',
                nombre: 'Pedro',
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('El correo ya está registrado');
        });
        it('returns 400 if matricula already exists', async () => {
            prisma.usuario.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id_usuario: 2 });
            const res = await request(app).post('/register').send({
                correo: 'new@mail.com',
                password: 'password123',
                nombre: 'Pedro',
                matricula: 'M12345',
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('La matrícula ya está registrada');
        });
        it('registers user successfully (201)', async () => {
            prisma.usuario.findUnique.mockResolvedValue(null);
            prisma.usuario.create.mockResolvedValue({
                id_usuario: 5,
                correo: 'new@mail.com',
                nombre: 'Pedro',
                matricula: 'M12345',
                rol: 'alumno',
                estado: 'pendiente',
            });
            const res = await request(app).post('/register').send({
                correo: 'new@mail.com',
                password: 'password123',
                nombre: 'Pedro',
                matricula: 'M12345',
            });
            expect(res.status).toBe(201);
            expect(res.body.usuario.id).toBe(5);
        });
        it('returns 500 on internal server error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('Fatal DB Error'));
            const res = await request(app).post('/register').send({
                correo: 'new@mail.com',
                password: 'password123',
                nombre: 'Pedro',
            });
            expect(res.status).toBe(500);
        });
    });
    describe('POST /forgot-password', () => {
        it('returns 400 on Zod error', async () => {
            const res = await request(app).post('/forgot-password').send({ correo: 'bad' });
            expect(res.status).toBe(400);
        });
        it('returns message on non-existent or inactive user', async () => {
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res = await request(app).post('/forgot-password').send({ correo: 'none@mail.com' });
            expect(res.status).toBe(200);
            prisma.usuario.findUnique.mockResolvedValue({ estado: 'pendiente' });
            const res2 = await request(app).post('/forgot-password').send({ correo: 'inactive@mail.com' });
            expect(res2.status).toBe(200);
        });
        it('sends reset code on valid active user', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, correo: 'active@mail.com', nombre: 'Carlos', estado: 'activo' });
            const res = await request(app).post('/forgot-password').send({ correo: 'active@mail.com' });
            expect(res.status).toBe(200);
            expect(prisma.codigoOtp.create).toHaveBeenCalled();
        });
        it('returns 500 on internal error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('Err'));
            const res = await request(app).post('/forgot-password').send({ correo: 'active@mail.com' });
            expect(res.status).toBe(500);
        });
    });
    describe('POST /reset-password', () => {
        it('returns 400 on Zod error', async () => {
            const res = await request(app).post('/reset-password').send({ correo: 'bad' });
            expect(res.status).toBe(400);
        });
        it('returns 401 if user not found', async () => {
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res = await request(app).post('/reset-password').send({
                correo: 'user@mail.com',
                codigo: '123456',
                newPassword: 'newpassword123',
            });
            expect(res.status).toBe(401);
        });
        it('returns 401 if OTP not found or invalid', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, correo: 'user@mail.com' });
            prisma.codigoOtp.findFirst.mockResolvedValue(null);
            const res = await request(app).post('/reset-password').send({
                correo: 'user@mail.com',
                codigo: '123456',
                newPassword: 'newpassword123',
            });
            expect(res.status).toBe(401);
        });
        it('resets password successfully', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, correo: 'user@mail.com' });
            prisma.codigoOtp.findFirst.mockResolvedValue({ id: 10 });
            const res = await request(app).post('/reset-password').send({
                correo: 'user@mail.com',
                codigo: '123456',
                newPassword: 'newpassword123',
            });
            expect(res.status).toBe(200);
            expect(prisma.$transaction).toHaveBeenCalled();
        });
        it('returns 500 on internal error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('Err'));
            const res = await request(app).post('/reset-password').send({
                correo: 'user@mail.com',
                codigo: '123456',
                newPassword: 'newpassword123',
            });
            expect(res.status).toBe(500);
        });
    });
    describe('GET /me, PUT /validate/:id, GET /pending, GET /users', () => {
        it('GET /me returns user profile or 404', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, nombre: 'Admin' });
            const res = await request(app).get('/me').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res404 = await request(app).get('/me').set('Authorization', `Bearer ${adminToken}`);
            expect(res404.status).toBe(404);
        });
        it('GET /me returns 500 on error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('DB Ex'));
            const res = await request(app).get('/me').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(500);
        });
        it('PUT /validate/:id validates user or returns 400/500', async () => {
            const resBad = await request(app).put('/validate/1').set('Authorization', `Bearer ${adminToken}`).send({ estado: 'invalido' });
            expect(resBad.status).toBe(400);
            prisma.usuario.update.mockResolvedValue({ id_usuario: 1, estado: 'activo' });
            const resOk = await request(app).put('/validate/1').set('Authorization', `Bearer ${adminToken}`).send({ estado: 'activo' });
            expect(resOk.status).toBe(200);
            prisma.usuario.update.mockRejectedValue(new Error('DB Ex'));
            const res500 = await request(app).put('/validate/1').set('Authorization', `Bearer ${adminToken}`).send({ estado: 'activo' });
            expect(res500.status).toBe(500);
        });
        it('GET /pending returns pending users or 500', async () => {
            prisma.usuario.findMany.mockResolvedValue([{ id_usuario: 2 }]);
            const res = await request(app).get('/pending').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            prisma.usuario.findMany.mockRejectedValue(new Error('DB Ex'));
            const res500 = await request(app).get('/pending').set('Authorization', `Bearer ${adminToken}`);
            expect(res500.status).toBe(500);
        });
        it('GET /users returns all users or 500', async () => {
            prisma.usuario.findMany.mockResolvedValue([{ id_usuario: 1 }]);
            const res = await request(app).get('/users').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            prisma.usuario.findMany.mockRejectedValue(new Error('DB Ex'));
            const res500 = await request(app).get('/users').set('Authorization', `Bearer ${adminToken}`);
            expect(res500.status).toBe(500);
        });
    });
});
//# sourceMappingURL=index.test.js.map