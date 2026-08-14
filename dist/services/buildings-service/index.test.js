import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../lib/prisma.js';
vi.mock('../../lib/prisma.js', () => ({
    prisma: {
        edificio: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        salon: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        profesor: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        cubiculo: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        usuario: {
            update: vi.fn(),
        },
        producto: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        venta: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
    },
}));
describe('Buildings Service', () => {
    let app;
    let adminToken;
    beforeEach(async () => {
        vi.clearAllMocks();
        const { app: expressApp } = await import('./index.js');
        app = expressApp;
        const { generateToken } = await import('../../lib/jwt.js');
        adminToken = generateToken({ userId: '1', email: 'admin@airguide.com', role: 'admin' });
    });
    describe('Edificios Endpoints', () => {
        it('GET / lists edificios with query filters', async () => {
            prisma.edificio.findMany.mockResolvedValue([{ id_edificio: 1, nombre: 'Edificio A' }]);
            const res = await request(app).get('/?tipo=academico&activo=true');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([{ id_edificio: 1, nombre: 'Edificio A' }]);
        });
        it('GET / handles 500 error', async () => {
            prisma.edificio.findMany.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).get('/');
            expect(res.status).toBe(500);
        });
        it('GET /:id returns single edificio or 404', async () => {
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            const res = await request(app).get('/1');
            expect(res.status).toBe(200);
            prisma.edificio.findUnique.mockResolvedValue(null);
            const res404 = await request(app).get('/999');
            expect(res404.status).toBe(404);
        });
        it('GET /:id handles 500 error', async () => {
            prisma.edificio.findUnique.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).get('/1');
            expect(res.status).toBe(500);
        });
        it('POST / creates edificio', async () => {
            prisma.edificio.create.mockResolvedValue({ id_edificio: 1, nombre: 'Nuevo Edificio' });
            const res = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Nuevo Edificio',
                latitud: 20.6,
                longitud: -100.4,
                tipo: 'academico',
            });
            expect(res.status).toBe(201);
        });
        it('POST / handles validation error and 500', async () => {
            const resVal = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({ nombre: '' });
            expect(resVal.status).toBe(400);
            prisma.edificio.create.mockRejectedValue(new Error('DB Error'));
            const res500 = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Nuevo Edificio',
                latitud: 20.6,
                longitud: -100.4,
                tipo: 'academico',
            });
            expect(res500.status).toBe(500);
        });
        it('PUT /:id updates edificio', async () => {
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            prisma.edificio.update.mockResolvedValue({ id_edificio: 1, nombre: 'Modificado' });
            const res = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({ nombre: 'Modificado' });
            expect(res.status).toBe(200);
        });
        it('PUT /:id handles validation error and 500', async () => {
            const resVal = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({ latitud: 999 });
            expect(resVal.status).toBe(400);
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            prisma.edificio.update.mockRejectedValue(new Error('DB Error'));
            const res500 = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({ nombre: 'Modificado' });
            expect(res500.status).toBe(500);
        });
        it('DELETE /:id deletes edificio', async () => {
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            prisma.edificio.delete.mockResolvedValue({});
            const res = await request(app).delete('/1').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
        it('DELETE /:id handles 500 error', async () => {
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            prisma.edificio.delete.mockRejectedValue(new Error('DB Error'));
            const res = await request(app).delete('/1').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(500);
        });
    });
    describe('Salones, Cubiculos & Profesores Endpoints', () => {
        it('GET /salones and GET /:id/salones', async () => {
            prisma.salon.findMany.mockResolvedValue([{ id_salon: 1 }]);
            const res1 = await request(app).get('/salones');
            expect(res1.status).toBe(200);
            const res2 = await request(app).get('/1/salones');
            expect(res2.status).toBe(200);
        });
        it('Salones GET endpoints handle 500', async () => {
            prisma.salon.findMany.mockRejectedValue(new Error('DB Error'));
            const res1 = await request(app).get('/salones');
            expect(res1.status).toBe(500);
            const res2 = await request(app).get('/1/salones');
            expect(res2.status).toBe(500);
        });
        it('POST /:id/salones, PUT /salones/:id, DELETE /salones/:id', async () => {
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            prisma.salon.create.mockResolvedValue({ id_salon: 1 });
            const resCreate = await request(app).post('/1/salones').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Salon 101', piso: 1, tipo: 'aula',
            });
            expect(resCreate.status).toBe(201);
            prisma.salon.update.mockResolvedValue({ id_salon: 1 });
            const resUpdate = await request(app).put('/salones/1').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Salon 101-A',
            });
            expect(resUpdate.status).toBe(200);
            prisma.salon.delete.mockResolvedValue({});
            const resDelete = await request(app).delete('/salones/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(200);
        });
        it('Salones CUD endpoints handle 404 and 500', async () => {
            prisma.edificio.findUnique.mockResolvedValue(null);
            const res404 = await request(app).post('/99/salones').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Salon',
            });
            expect(res404.status).toBe(404);
            prisma.edificio.findUnique.mockResolvedValue({ id_edificio: 1 });
            prisma.salon.create.mockRejectedValue(new Error('DB Error'));
            const resCreate = await request(app).post('/1/salones').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Salon 101',
            });
            expect(resCreate.status).toBe(500);
            prisma.salon.update.mockRejectedValue(new Error('DB Error'));
            const resUpdate = await request(app).put('/salones/1').set('Authorization', `Bearer ${adminToken}`).send({ nombre: 'Salon' });
            expect(resUpdate.status).toBe(500);
            prisma.salon.delete.mockRejectedValue(new Error('DB Error'));
            const resDelete = await request(app).delete('/salones/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(500);
        });
        it('GET, POST, PUT, DELETE /profesores', async () => {
            prisma.profesor.findMany.mockResolvedValue([{ id_profesor: 1 }]);
            const resGet = await request(app).get('/profesores');
            expect(resGet.status).toBe(200);
            prisma.profesor.findUnique.mockResolvedValue({ id_profesor: 1 });
            const resGetOne = await request(app).get('/profesores/1');
            expect(resGetOne.status).toBe(200);
            prisma.profesor.findUnique.mockResolvedValue(null);
            const resGet404 = await request(app).get('/profesores/99');
            expect(resGet404.status).toBe(404);
            prisma.usuario.update.mockResolvedValue({});
            prisma.profesor.create.mockResolvedValue({ id_profesor: 1 });
            prisma.cubiculo.update.mockResolvedValue({});
            const resPost = await request(app).post('/profesores').set('Authorization', `Bearer ${adminToken}`).send({
                id_usuario: '5', departamento: 'Sistemas', id_cubiculo: '2',
            });
            expect(resPost.status).toBe(201);
            prisma.profesor.update.mockResolvedValue({ id_profesor: 1 });
            const resPut = await request(app).put('/profesores/1').set('Authorization', `Bearer ${adminToken}`).send({
                departamento: 'TI', id_cubiculo: '3',
            });
            expect(resPut.status).toBe(200);
            prisma.profesor.delete.mockResolvedValue({});
            const resDelete = await request(app).delete('/profesores/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(200);
        });
        it('Profesores endpoints handle 500', async () => {
            prisma.profesor.findMany.mockRejectedValue(new Error('Err'));
            const resGet = await request(app).get('/profesores');
            expect(resGet.status).toBe(500);
            prisma.profesor.findUnique.mockRejectedValue(new Error('Err'));
            const resGetOne = await request(app).get('/profesores/1');
            expect(resGetOne.status).toBe(500);
            prisma.usuario.update.mockRejectedValue(new Error('Err'));
            const resPost = await request(app).post('/profesores').set('Authorization', `Bearer ${adminToken}`).send({ id_usuario: '5' });
            expect(resPost.status).toBe(500);
            prisma.profesor.update.mockRejectedValue(new Error('Err'));
            const resPut = await request(app).put('/profesores/1').set('Authorization', `Bearer ${adminToken}`).send({ departamento: 'Y' });
            expect(resPut.status).toBe(500);
            prisma.profesor.delete.mockRejectedValue(new Error('Err'));
            const resDelete = await request(app).delete('/profesores/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(500);
        });
        it('GET, POST, PUT, DELETE /cubiculos', async () => {
            prisma.cubiculo.findMany.mockResolvedValue([{ id_cubiculo: 1 }]);
            const resGet = await request(app).get('/cubiculos');
            expect(resGet.status).toBe(200);
            prisma.cubiculo.create.mockResolvedValue({ id_cubiculo: 1 });
            const resPost = await request(app).post('/cubiculos').set('Authorization', `Bearer ${adminToken}`).send({
                id_profesor: '5', id_edificio: '1', numero: '101', piso: '1',
            });
            expect(resPost.status).toBe(201);
            prisma.cubiculo.update.mockResolvedValue({ id_cubiculo: 1 });
            const resPut = await request(app).put('/cubiculos/1').set('Authorization', `Bearer ${adminToken}`).send({
                id_profesor: '5', id_edificio: '1', numero: '102', piso: '1',
            });
            expect(resPut.status).toBe(200);
            prisma.cubiculo.delete.mockResolvedValue({});
            const resDelete = await request(app).delete('/cubiculos/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(200);
        });
        it('Cubiculos endpoints handle 500', async () => {
            prisma.cubiculo.findMany.mockRejectedValue(new Error('Err'));
            const resGet = await request(app).get('/cubiculos');
            expect(resGet.status).toBe(500);
            prisma.cubiculo.create.mockRejectedValue(new Error('Err'));
            const resPost = await request(app).post('/cubiculos').set('Authorization', `Bearer ${adminToken}`).send({
                id_profesor: '5', id_edificio: '1', numero: '101', piso: '1',
            });
            expect(resPost.status).toBe(500);
            prisma.cubiculo.update.mockRejectedValue(new Error('Err'));
            const resPut = await request(app).put('/cubiculos/1').set('Authorization', `Bearer ${adminToken}`).send({
                id_profesor: '5', id_edificio: '1', numero: '102', piso: '1',
            });
            expect(resPut.status).toBe(500);
            prisma.cubiculo.delete.mockRejectedValue(new Error('Err'));
            const resDelete = await request(app).delete('/cubiculos/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(500);
        });
    });
    describe('Productos & Ventas Endpoints', () => {
        it('GET, POST, PUT, DELETE /productos', async () => {
            prisma.producto.findMany.mockResolvedValue([{ id_producto: 1 }]);
            const resGet = await request(app).get('/productos?categoria=ropa&search=camiseta&activo=true');
            expect(resGet.status).toBe(200);
            prisma.producto.findUnique.mockResolvedValue({ id_producto: 1 });
            const resGetOne = await request(app).get('/productos/1');
            expect(resGetOne.status).toBe(200);
            prisma.producto.findUnique.mockResolvedValue(null);
            const resGet404 = await request(app).get('/productos/99');
            expect(resGet404.status).toBe(404);
            prisma.producto.create.mockResolvedValue({ id_producto: 1 });
            const resPost = await request(app).post('/productos').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Camiseta', precio: 200, categoria: 'ropa', stock: 10,
            });
            expect(resPost.status).toBe(201);
            prisma.producto.update.mockResolvedValue({ id_producto: 1 });
            const resPut = await request(app).put('/productos/1').set('Authorization', `Bearer ${adminToken}`).send({ precio: 250 });
            expect(resPut.status).toBe(200);
            prisma.producto.delete.mockResolvedValue({});
            const resDelete = await request(app).delete('/productos/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(200);
        });
        it('Productos endpoints handle 400 and 500', async () => {
            prisma.producto.findMany.mockRejectedValue(new Error('Err'));
            const resGet = await request(app).get('/productos');
            expect(resGet.status).toBe(500);
            prisma.producto.findUnique.mockRejectedValue(new Error('Err'));
            const resGetOne = await request(app).get('/productos/1');
            expect(resGetOne.status).toBe(500);
            const res400 = await request(app).post('/productos').set('Authorization', `Bearer ${adminToken}`).send({ nombre: 'Camiseta' });
            expect(res400.status).toBe(400);
            prisma.producto.create.mockRejectedValue(new Error('Err'));
            const resPost = await request(app).post('/productos').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'X', precio: 100, categoria: 'c',
            });
            expect(resPost.status).toBe(500);
            prisma.producto.update.mockRejectedValue(new Error('Err'));
            const resPut = await request(app).put('/productos/1').set('Authorization', `Bearer ${adminToken}`).send({ precio: 10 });
            expect(resPut.status).toBe(500);
            prisma.producto.delete.mockRejectedValue(new Error('Err'));
            const resDelete = await request(app).delete('/productos/1').set('Authorization', `Bearer ${adminToken}`);
            expect(resDelete.status).toBe(500);
        });
        it('POST /ventas creates a sale', async () => {
            prisma.producto.findUnique.mockResolvedValue({ id_producto: 1, nombre: 'Camiseta', stock: 10, precio: 200 });
            prisma.producto.update.mockResolvedValue({});
            prisma.venta.create.mockResolvedValue({ id_venta: 10, total: 400 });
            const res = await request(app).post('/ventas').send({
                cliente_nombre: 'Juan',
                items: [{ id_producto: 1, cantidad: 2 }],
            });
            expect(res.status).toBe(201);
        });
        it('POST /ventas returns 404 if product missing and 400 if insufficient stock', async () => {
            prisma.producto.findUnique.mockResolvedValue(null);
            const res404 = await request(app).post('/ventas').send({ items: [{ id_producto: 99, cantidad: 1 }] });
            expect(res404.status).toBe(404);
            prisma.producto.findUnique.mockResolvedValue({ id_producto: 1, nombre: 'Cami', stock: 1, precio: 100 });
            const res400 = await request(app).post('/ventas').send({ items: [{ id_producto: 1, cantidad: 5 }] });
            expect(res400.status).toBe(400);
        });
        it('POST /ventas handles 400 validation and 500 error', async () => {
            const resVal = await request(app).post('/ventas').send({ items: [] });
            expect(resVal.status).toBe(400);
            prisma.producto.findUnique.mockRejectedValue(new Error('Err'));
            const res500 = await request(app).post('/ventas').send({
                items: [{ id_producto: 1, cantidad: 1 }],
            });
            expect(res500.status).toBe(500);
        });
        it('GET /ventas lists sales for admin', async () => {
            prisma.venta.findMany.mockResolvedValue([{ id_venta: 10 }]);
            const res = await request(app).get('/ventas').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
        it('GET /ventas handles 500 error', async () => {
            prisma.venta.findMany.mockRejectedValue(new Error('Err'));
            const res = await request(app).get('/ventas').set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(500);
        });
    });
});
//# sourceMappingURL=index.test.js.map