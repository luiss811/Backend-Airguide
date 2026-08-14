import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../lib/prisma.js';
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        evento: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        usuario: {
            findUnique: vi.fn(),
        },
        invitadoEvento: {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
    },
}));
vi.mock('../../lib/eventoNeurona.js', () => ({
    evaluarEvento: vi.fn(),
    entrenarNeurona: vi.fn().mockResolvedValue({ loss: [0.1], epochs: [1] }),
}));
describe('Events Service', () => {
    let app;
    let adminToken;
    beforeEach(async () => {
        vi.clearAllMocks();
        const { app: expressApp } = await import('./index.js');
        app = expressApp;
        const { generateToken } = await import('../../lib/jwt.js');
        adminToken = generateToken({ userId: '1', email: 'admin@airguide.com', role: 'admin' });
    });
    describe('Events CRUD', () => {
        it('GET / lists events with filters', async () => {
            prisma.evento.findMany.mockResolvedValue([{ id_evento: 1, nombre: 'Evento A' }]);
            const res = await request(app).get('/?publico=true&activo=true');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id_evento: 1, nombre: 'Evento A' }]);
        });
        it('GET / handles 500 error', async () => {
            prisma.evento.findMany.mockRejectedValue(new Error('Err'));
            const res = await request(app).get('/');
            expect(res.status).toBe(500);
        });
        it('GET /:id returns event or 404', async () => {
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1 });
            const res = await request(app).get('/1');
            expect(res.status).toBe(200);
            prisma.evento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).get('/999');
            expect(res404.status).toBe(404);
        });
        it('GET /:id handles 500 error', async () => {
            prisma.evento.findUnique.mockRejectedValue(new Error('Err'));
            const res = await request(app).get('/1');
            expect(res.status).toBe(500);
        });
        it('POST / creates event after AI evaluation approval', async () => {
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: true, tipo: 'SIN_CONFLICTO' });
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, rol: 'rector', prioridad: 4 });
            prisma.evento.create.mockResolvedValue({ id_evento: 1, nombre: 'Conferencia Inaugural' });
            const res = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Inaugural',
                id_edificio: 1,
                prioridad_evento: 4,
            });
            expect(res.status).toBe(201);
            expect(res.body.id_evento).toBe(1);
        });
        it('POST / rejects event creation (409) when AI evaluation denies it', async () => {
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: false, mensaje: 'Conflicto de horario' });
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, rol: 'profesor', prioridad: 3 });
            const res = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Inaugural',
                id_edificio: 1,
                prioridad_evento: 3,
            });
            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Conflicto de horario');
        });
        it('POST / handles Zod error and 500 error', async () => {
            const resZod = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({ nombre: 'Tiny' });
            expect(resZod.status).toBe(400);
            prisma.usuario.findUnique.mockRejectedValue(new Error('Fatal Error'));
            const res500 = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Inaugural',
                id_edificio: 1,
                prioridad_evento: 4,
            });
            expect(res500.status).toBe(500);
        });
        it('PUT /:id updates event after AI evaluation', async () => {
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: true });
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, nombre: 'Anterior' });
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, prioridad: 4 });
            prisma.evento.update.mockResolvedValue({ id_evento: 1, nombre: 'Conferencia Editada' });
            const res = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Editada',
                prioridad_evento: 4,
                id_edificio: 1,
            });
            expect(res.status).toBe(200);
        });
        it('PUT /:id handles 404, AI rejection (409), and 500 error', async () => {
            prisma.evento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).put('/99').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Editada',
                prioridad_evento: 4,
            });
            expect(res404.status).toBe(404);
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1 });
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 1, prioridad: 4 });
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: false, mensaje: 'No disponible' });
            const resRejected = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Editada',
                prioridad_evento: 4,
                id_edificio: 1,
            });
            expect(resRejected.status).toBe(409);
            prisma.evento.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Conferencia Editada',
                prioridad_evento: 4,
            });
            expect(res500.status).toBe(500);
        });
        it('DELETE /:id deletes event', async () => {
            prisma.evento.delete.mockResolvedValue({});
            const res = await request(app).delete('/1').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
        it('DELETE /:id handles 500 error', async () => {
            prisma.evento.delete.mockRejectedValue(new Error('Err'));
            const res = await request(app).delete('/1').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(500);
        });
        it('POST /entrenar-neurona triggers neural model retraining', async () => {
            const res = await request(app).post('/entrenar-neurona').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        it('POST /entrenar-neurona handles 500 error', async () => {
            const { entrenarNeurona } = await import('../../lib/eventoNeurona.js');
            entrenarNeurona.mockRejectedValue(new Error('Train failed'));
            const res = await request(app).post('/entrenar-neurona').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(500);
        });
        it('POST /:id/confirmar-asistencia confirms event QR attendance', async () => {
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, asistentes_confirmados: 5 });
            prisma.evento.update.mockResolvedValue({ id_evento: 1, asistentes_confirmados: 6 });
            const res = await request(app).post('/1/confirmar-asistencia');
            expect(res.status).toBe(200);
            expect(res.body.asistentes_confirmados).toBe(6);
        });
        it('POST /:id/confirmar-asistencia returns 404 or 500', async () => {
            prisma.evento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).post('/99/confirmar-asistencia');
            expect(res404.status).toBe(404);
            prisma.evento.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).post('/1/confirmar-asistencia');
            expect(res500.status).toBe(500);
        });
    });
    describe('Invitados & Tickets Endpoints', () => {
        it('GET /:id/invitados returns guest list or 500', async () => {
            prisma.invitadoEvento.findMany.mockResolvedValue([{ id_invitado: 1 }]);
            const res = await request(app).get('/1/invitados').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            prisma.invitadoEvento.findMany.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).get('/1/invitados').set('Authorization', `Bearer ${adminToken}`);
            expect(res500.status).toBe(500);
        });
        it('POST /:id/registrar-invitado registers a guest for an event', async () => {
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1 });
            prisma.invitadoEvento.create.mockResolvedValue({ id_invitado: 10, nombre: 'Maria' });
            const res = await request(app).post('/1/registrar-invitado').send({
                nombre: 'Maria',
                apellido: 'Lopez',
                edad: 22,
                correo: 'maria@example.com',
            });
            expect(res.status).toBe(201);
            expect(res.body.nombre).toBe('Maria');
        });
        it('POST /:id/registrar-invitado returns 400 on missing params, 404 if event missing, 500 on error', async () => {
            const res400 = await request(app).post('/1/registrar-invitado').send({ nombre: 'Maria' });
            expect(res400.status).toBe(400);
            prisma.evento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).post('/99/registrar-invitado').send({
                nombre: 'Maria', apellido: 'L', edad: 20, correo: 'm@l.com',
            });
            expect(res404.status).toBe(404);
            prisma.evento.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).post('/1/registrar-invitado').send({
                nombre: 'Maria', apellido: 'L', edad: 20, correo: 'm@l.com',
            });
            expect(res500.status).toBe(500);
        });
        it('POST /confirmar-ticket/:id_invitado confirms guest ticket attendance', async () => {
            prisma.invitadoEvento.findUnique.mockResolvedValue({
                id_invitado: 10,
                id_evento: 1,
                asistencia: false,
                evento: { nombre: 'Congreso', edificio: { nombre: 'Central' } },
            });
            prisma.invitadoEvento.update.mockResolvedValue({
                id_invitado: 10,
                nombre: 'Maria',
                apellido: 'Lopez',
                correo: 'm@l.com',
                asistencia: true,
            });
            prisma.evento.update.mockResolvedValue({});
            const res = await request(app).post('/confirmar-ticket/10');
            expect(res.status).toBe(200);
            expect(res.body.yaConfirmado).toBe(false);
        });
        it('POST /confirmar-ticket/:id_invitado returns 404 or 500', async () => {
            prisma.invitadoEvento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).post('/confirmar-ticket/99');
            expect(res404.status).toBe(404);
            prisma.invitadoEvento.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).post('/confirmar-ticket/10');
            expect(res500.status).toBe(500);
        });
    });
});
//# sourceMappingURL=index.test.js.map