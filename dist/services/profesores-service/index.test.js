import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../lib/prisma.js';
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        usuario: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        profesor: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        cubiculo: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        evento: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
    },
}));
vi.mock('../../lib/eventoNeurona.js', () => ({
    evaluarEvento: vi.fn(),
}));
describe('Profesores Service', () => {
    let app;
    let profesorToken;
    beforeEach(async () => {
        vi.clearAllMocks();
        const { app: expressApp } = await import('./index.js');
        app = expressApp;
        const { generateToken } = await import('../../lib/jwt.js');
        profesorToken = generateToken({ userId: '10', email: 'profesor@airguide.com', role: 'profesor' });
    });
    describe('GET & PUT /me', () => {
        it('GET /me returns professor profile or 404', async () => {
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 10, nombre: 'Dr. Smith' });
            const res = await request(app).get('/me').set('Authorization', `Bearer ${profesorToken}`);
            expect(res.status).toBe(200);
            expect(res.body.nombre).toBe('Dr. Smith');
            prisma.usuario.findUnique.mockResolvedValue(null);
            const res404 = await request(app).get('/me').set('Authorization', `Bearer ${profesorToken}`);
            expect(res404.status).toBe(404);
        });
        it('GET /me handles 500 error', async () => {
            prisma.usuario.findUnique.mockRejectedValue(new Error('DB Err'));
            const res = await request(app).get('/me').set('Authorization', `Bearer ${profesorToken}`);
            expect(res.status).toBe(500);
        });
        it('PUT /me returns 400 when email is already registered by another user', async () => {
            prisma.usuario.findFirst.mockResolvedValue({ id_usuario: 99 });
            const resEmailConflict = await request(app).put('/me').set('Authorization', `Bearer ${profesorToken}`).send({
                correo: 'existente@airguide.com',
            });
            expect(resEmailConflict.status).toBe(400);
            expect(resEmailConflict.body.error).toContain('correo electrónico ya está registrado');
        });
        it('PUT /me returns 400 when matricula is already registered by another user', async () => {
            prisma.usuario.findFirst.mockResolvedValue(null); // No email conflict
            prisma.usuario.findFirst.mockResolvedValueOnce({ id_usuario: 99 }); // Matricula conflict
            const resMatriculaConflict = await request(app).put('/me').set('Authorization', `Bearer ${profesorToken}`).send({
                matricula: 'MAT123',
            });
            expect(resMatriculaConflict.status).toBe(400);
            expect(resMatriculaConflict.body.error).toContain('matrícula ya está registrada');
        });
        it('PUT /me updates professor profile and cubiculo assignment', async () => {
            prisma.usuario.findFirst.mockResolvedValue(null);
            prisma.usuario.update.mockResolvedValue({});
            prisma.profesor.findUnique.mockResolvedValue({ id_profesor: 5 });
            prisma.profesor.update.mockResolvedValue({});
            prisma.cubiculo.findFirst.mockResolvedValue({ id_cubiculo: 1 });
            prisma.cubiculo.update.mockResolvedValue({});
            prisma.usuario.findUnique.mockResolvedValue({
                id_usuario: 10,
                nombre: 'Dr. Smith Updated',
            });
            const res = await request(app).put('/me').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Dr. Smith Updated',
                horario_pdf: 'base64data',
                cubiculo: { id_edificio: '1', piso: '2', numero: '201' },
            });
            expect(res.status).toBe(200);
        });
        it('PUT /me creates professor profile and cubiculo if non-existent and handles 500', async () => {
            prisma.usuario.findFirst.mockResolvedValue(null);
            prisma.usuario.update.mockResolvedValue({});
            prisma.profesor.findUnique.mockResolvedValue(null);
            prisma.profesor.create.mockResolvedValue({ id_profesor: 6 });
            prisma.cubiculo.findFirst.mockResolvedValue(null);
            prisma.cubiculo.create.mockResolvedValue({});
            prisma.usuario.findUnique.mockResolvedValue({ id_usuario: 10, nombre: 'Dr. Smith' });
            const res = await request(app).put('/me').set('Authorization', `Bearer ${profesorToken}`).send({
                cubiculo: { id_edificio: '1', piso: '1', numero: '101' },
            });
            expect(res.status).toBe(200);
            prisma.usuario.update.mockRejectedValue(new Error('DB Err'));
            const res500 = await request(app).put('/me').set('Authorization', `Bearer ${profesorToken}`).send({});
            expect(res500.status).toBe(500);
        });
    });
    describe('Eventos Profesores CRUD', () => {
        it('GET /eventos returns professor events or 500', async () => {
            prisma.evento.findMany.mockResolvedValue([{ id_evento: 1, id_creador: 10 }]);
            const res = await request(app).get('/eventos').set('Authorization', `Bearer ${profesorToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id_evento: 1, id_creador: 10 }]);
            prisma.evento.findMany.mockRejectedValue(new Error('DB Err'));
            const res500 = await request(app).get('/eventos').set('Authorization', `Bearer ${profesorToken}`);
            expect(res500.status).toBe(500);
        });
        it('POST /eventos creates event for professor after AI evaluation', async () => {
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: true, tipo: 'DESPLAZAMIENTO_REALIZADO' });
            prisma.evento.create.mockResolvedValue({ id_evento: 1, id_creador: 10, prioridad_evento: 3 });
            const res = await request(app).post('/eventos').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria de Tesis',
                id_edificio: 1,
                prioridad_evento: 3,
            });
            expect(res.status).toBe(201);
            expect(res.body.warning).toBeDefined();
        });
        it('POST /eventos handles AI rejection (409), Zod error, 500 error', async () => {
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: false, mensaje: 'Salón ocupado' });
            const resRej = await request(app).post('/eventos').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria de Tesis',
                id_edificio: 1,
                prioridad_evento: 3,
            });
            expect(resRej.status).toBe(409);
            const resZod = await request(app).post('/eventos').set('Authorization', `Bearer ${profesorToken}`).send({ nombre: 'X' });
            expect(resZod.status).toBe(400);
            evaluarEvento.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).post('/eventos').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria de Tesis',
                id_edificio: 1,
                prioridad_evento: 3,
            });
            expect(res500.status).toBe(500);
        });
        it('PUT /eventos/:id updates professor event if owner', async () => {
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: true });
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, id_creador: 10 });
            prisma.evento.update.mockResolvedValue({ id_evento: 1, nombre: 'Asesoria Editada' });
            const res = await request(app).put('/eventos/1').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria Editada',
                prioridad_evento: 3,
                id_edificio: 1,
            });
            expect(res.status).toBe(200);
        });
        it('PUT /eventos/:id returns 404 if event missing, 403 if not owner, and 409 if AI rejects', async () => {
            prisma.evento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).put('/eventos/99').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria Editada',
                prioridad_evento: 3,
            });
            expect(res404.status).toBe(404);
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, id_creador: 99 });
            const res403 = await request(app).put('/eventos/1').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria Editada',
                prioridad_evento: 3,
            });
            expect(res403.status).toBe(403);
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, id_creador: 10 });
            const { evaluarEvento } = await import('../../lib/eventoNeurona.js');
            evaluarEvento.mockResolvedValue({ permitir: false, mensaje: 'Conflicto' });
            const res409 = await request(app).put('/eventos/1').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria Editada',
                prioridad_evento: 3,
                id_edificio: 1,
            });
            expect(res409.status).toBe(409);
        });
        it('PUT /eventos/:id handles 500 error', async () => {
            prisma.evento.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).put('/eventos/1').set('Authorization', `Bearer ${profesorToken}`).send({
                nombre: 'Asesoria Editada',
                prioridad_evento: 3,
            });
            expect(res500.status).toBe(500);
        });
        it('DELETE /eventos/:id deletes event if owner', async () => {
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, id_creador: 10 });
            prisma.evento.delete.mockResolvedValue({});
            const res = await request(app).delete('/eventos/1').set('Authorization', `Bearer ${profesorToken}`);
            expect(res.status).toBe(200);
        });
        it('DELETE /eventos/:id returns 404 if missing, 403 if not owner, and 500 on error', async () => {
            prisma.evento.findUnique.mockResolvedValue(null);
            const res404 = await request(app).delete('/eventos/99').set('Authorization', `Bearer ${profesorToken}`);
            expect(res404.status).toBe(404);
            prisma.evento.findUnique.mockResolvedValue({ id_evento: 1, id_creador: 99 });
            const res403 = await request(app).delete('/eventos/1').set('Authorization', `Bearer ${profesorToken}`);
            expect(res403.status).toBe(403);
            prisma.evento.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).delete('/eventos/1').set('Authorization', `Bearer ${profesorToken}`);
            expect(res500.status).toBe(500);
        });
    });
});
//# sourceMappingURL=index.test.js.map