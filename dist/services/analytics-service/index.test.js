import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../lib/prisma.js';
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        usuario: {
            count: vi.fn(),
            groupBy: vi.fn(),
        },
        edificio: {
            count: vi.fn(),
            groupBy: vi.fn(),
            findMany: vi.fn(),
        },
        salon: { count: vi.fn() },
        profesor: { count: vi.fn() },
        cubiculo: { count: vi.fn() },
        evento: {
            count: vi.fn(),
            findMany: vi.fn(),
            groupBy: vi.fn(),
        },
        ruta: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
        logAcceso: {
            count: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));
vi.mock('../../lib/congestionNeurona.js', () => ({
    entrenarCongestion: vi.fn().mockResolvedValue(0.012),
}));
describe('Analytics Service', () => {
    let app;
    let adminToken;
    beforeEach(async () => {
        vi.clearAllMocks();
        const { app: expressApp } = await import('./index.js');
        app = expressApp;
        const { generateToken } = await import('../../lib/jwt.js');
        adminToken = generateToken({ userId: '1', email: 'admin@airguide.com', role: 'admin' });
    });
    it('GET /dashboard returns summary statistics', async () => {
        prisma.usuario.count.mockResolvedValue(10);
        prisma.edificio.count.mockResolvedValue(5);
        prisma.salon.count.mockResolvedValue(20);
        prisma.profesor.count.mockResolvedValue(4);
        prisma.cubiculo.count.mockResolvedValue(4);
        prisma.evento.count.mockResolvedValue(8);
        prisma.ruta.count.mockResolvedValue(12);
        prisma.logAcceso.count.mockResolvedValue(50);
        const res = await request(app).get('/dashboard').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.usuarios.total).toBe(10);
        expect(res.body.totalAccesos).toBe(50);
    });
    it('GET /dashboard handles 500 error', async () => {
        prisma.usuario.count.mockRejectedValue(new Error('Err'));
        const res = await request(app).get('/dashboard').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(500);
    });
    it('GET /edificios-tipo returns breakdown or 500', async () => {
        prisma.edificio.groupBy.mockResolvedValue([{ tipo: 'academico', _count: { id_edificio: 5 } }]);
        const res = await request(app).get('/edificios-tipo').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ tipo: 'academico', cantidad: 5 }]);
        prisma.edificio.groupBy.mockRejectedValue(new Error('Err'));
        const res500 = await request(app).get('/edificios-tipo').set('Authorization', `Bearer ${adminToken}`);
        expect(res500.status).toBe(500);
    });
    it('GET /eventos-proximos returns upcoming events or 500', async () => {
        prisma.evento.findMany.mockResolvedValue([{ id_evento: 1, edificio: { nombre: 'Central' } }]);
        const res = await request(app).get('/eventos-proximos').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id_evento: 1, edificio: { nombre: 'Central' } }]);
        prisma.evento.findMany.mockRejectedValue(new Error('Err'));
        const res500 = await request(app).get('/eventos-proximos').set('Authorization', `Bearer ${adminToken}`);
        expect(res500.status).toBe(500);
    });
    it('GET /accesos-recientes returns recent login logs or 500', async () => {
        prisma.logAcceso.findMany.mockResolvedValue([{
                id: 1, fecha: new Date(), usuario: { nombre: 'Juan', correo: 'j@m.com', rol: 'alumno' },
            }]);
        const res = await request(app).get('/accesos-recientes?days=7').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        prisma.logAcceso.findMany.mockRejectedValue(new Error('Err'));
        const res500 = await request(app).get('/accesos-recientes').set('Authorization', `Bearer ${adminToken}`);
        expect(res500.status).toBe(500);
    });
    it('GET /accesos-timeline returns access logs timeline or 500', async () => {
        prisma.logAcceso.findMany.mockResolvedValue([{
                fecha: new Date('2026-08-14T10:00:00Z'),
            }]);
        const res = await request(app).get('/accesos-timeline?days=30').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body[0].accesos).toBe(1);
        prisma.logAcceso.findMany.mockRejectedValue(new Error('Err'));
        const res500 = await request(app).get('/accesos-timeline').set('Authorization', `Bearer ${adminToken}`);
        expect(res500.status).toBe(500);
    });
    it('GET /usuarios-rol returns user count by role and state or 500', async () => {
        prisma.usuario.groupBy.mockResolvedValue([{ rol: 'alumno', estado: 'activo', _count: { id_usuario: 50 } }]);
        const res = await request(app).get('/usuarios-rol').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ rol: 'alumno', estado: 'activo', cantidad: 50 }]);
        prisma.usuario.groupBy.mockRejectedValue(new Error('Err'));
        const res500 = await request(app).get('/usuarios-rol').set('Authorization', `Bearer ${adminToken}`);
        expect(res500.status).toBe(500);
    });
    it('GET /rutas-populares returns top used routes with building mapping or 500', async () => {
        prisma.ruta.findMany.mockResolvedValue([{
                id_ruta: 1, origen_tipo: 'edificio', origen_id: 10, destino_tipo: 'edificio', destino_id: 20, contador_usos: 15,
            }]);
        prisma.edificio.findMany.mockResolvedValue([
            { id_edificio: 10, nombre: 'Edificio A' },
            { id_edificio: 20, nombre: 'Edificio B' },
        ]);
        const res = await request(app).get('/rutas-populares').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body[0].origen).toBe('Edificio A');
        expect(res.body[0].destino).toBe('Edificio B');
        expect(res.body[0].usos).toBe(15);
        prisma.ruta.findMany.mockRejectedValue(new Error('Err'));
        const res500 = await request(app).get('/rutas-populares').set('Authorization', `Bearer ${adminToken}`);
        expect(res500.status).toBe(500);
    });
    it('POST /train-congestion trains neural congestion model', async () => {
        const res = await request(app).post('/train-congestion').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.loss).toBe(0.012);
    });
    it('POST /train-congestion handles 500 error', async () => {
        const { entrenarCongestion } = await import('../../lib/congestionNeurona.js');
        entrenarCongestion.mockRejectedValue(new Error('Train failed'));
        const res = await request(app).post('/train-congestion').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(500);
    });
});
//# sourceMappingURL=index.test.js.map