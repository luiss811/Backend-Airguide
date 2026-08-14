import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '../../lib/prisma.js';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    ruta: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rutaDetalle: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    edificio: {
      findMany: vi.fn(),
    },
    caminoGeografico: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
  },
}));

vi.mock('../../lib/congestionNeurona.js', () => ({
  predecirCongestionRuta: vi.fn().mockResolvedValue(0.85),
}));

describe('Navigation Service', () => {
  let app: any;
  let adminToken: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { app: expressApp } = await import('./index.js');
    app = expressApp;

    const { generateToken } = await import('../../lib/jwt.js');
    adminToken = generateToken({ userId: '1', email: 'admin@airguide.com', role: 'admin' });
  });

  describe('Rutas Query & Find', () => {
    it('GET / lists rutas with filters', async () => {
      (prisma.ruta.findMany as any).mockResolvedValue([{ id_ruta: 1, tipo: 'interna' }]);
      const res = await request(app).get('/?tipo=interna&activo=true&origen_tipo=edificio&destino_tipo=salon');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id_ruta: 1, tipo: 'interna' }]);
    });

    it('GET / handles 500 error', async () => {
      (prisma.ruta.findMany as any).mockRejectedValue(new Error('Err'));
      const res = await request(app).get('/');
      expect(res.status).toBe(500);
    });

    it('GET /:id returns single route or 404', async () => {
      (prisma.ruta.findUnique as any).mockResolvedValue({ id_ruta: 1 });
      const res = await request(app).get('/1');
      expect(res.status).toBe(200);

      (prisma.ruta.findUnique as any).mockResolvedValue(null);
      const res404 = await request(app).get('/99');
      expect(res404.status).toBe(404);
    });

    it('GET /:id handles 500 error', async () => {
      (prisma.ruta.findUnique as any).mockRejectedValue(new Error('Err'));
      const res = await request(app).get('/1');
      expect(res.status).toBe(500);
    });

    it('POST /find finds active route, increments usage counter, predicts congestion', async () => {
      (prisma.ruta.findFirst as any).mockResolvedValue({
        id_ruta: 1,
        origen_tipo: 'edificio',
        origen_id: 1,
        destino_tipo: 'salon',
        destino_id: 2,
        detalles: [{ orden: 1, latitud: 20.6, longitud: -100.4 }],
      });
      (prisma.ruta.update as any).mockResolvedValue({});

      const res = await request(app).post('/find').send({
        origen_tipo: 'edificio',
        origen_id: 1,
        destino_tipo: 'salon',
        destino_id: 2,
      });

      expect(res.status).toBe(200);
      expect(res.body.id_ruta).toBe(1);
      expect(prisma.ruta.update).toHaveBeenCalledWith({
        where: { id_ruta: 1 },
        data: { contador_usos: { increment: 1 } },
      });
    });

    it('POST /find returns 400 on missing params, 404 if route not found, 500 on error', async () => {
      const res400 = await request(app).post('/find').send({ origen_tipo: 'edificio' });
      expect(res400.status).toBe(400);

      (prisma.ruta.findFirst as any).mockResolvedValue(null);
      const res404 = await request(app).post('/find').send({
        origen_tipo: 'edificio', origen_id: 1, destino_tipo: 'salon', destino_id: 99,
      });
      expect(res404.status).toBe(404);

      (prisma.ruta.findFirst as any).mockRejectedValue(new Error('Err'));
      const res500 = await request(app).post('/find').send({
        origen_tipo: 'edificio', origen_id: 1, destino_tipo: 'salon', destino_id: 2,
      });
      expect(res500.status).toBe(500);
    });
  });

  describe('Rutas CUD & Details', () => {
    it('POST / creates route', async () => {
      (prisma.ruta.create as any).mockResolvedValue({ id_ruta: 1 });
      const res = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
        tipo: 'interna',
        origen_tipo: 'edificio',
        origen_id: 1,
        destino_tipo: 'salon',
        destino_id: 2,
        detalles: [{ orden: 1, instruccion: 'Caminar 10m', latitud: 20.6, longitud: -100.4 }],
      });
      expect(res.status).toBe(201);
    });

    it('POST / handles 500 error', async () => {
      (prisma.ruta.create as any).mockRejectedValue(new Error('Err'));
      const res500 = await request(app).post('/').set('Authorization', `Bearer ${adminToken}`).send({
        tipo: 'interna',
        origen_tipo: 'edificio',
        origen_id: 1,
        destino_tipo: 'salon',
        destino_id: 2,
      });
      expect(res500.status).toBe(500);
    });

    it('PUT /:id updates route', async () => {
      (prisma.ruta.update as any).mockResolvedValue({ id_ruta: 1 });
      const res = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({
        tipo: 'externa',
      });
      expect(res.status).toBe(200);
    });

    it('PUT /:id handles 500 error', async () => {
      (prisma.ruta.update as any).mockRejectedValue(new Error('Err'));
      const res500 = await request(app).put('/1').set('Authorization', `Bearer ${adminToken}`).send({ tipo: 'externa' });
      expect(res500.status).toBe(500);
    });

    it('DELETE /:id deletes route', async () => {
      (prisma.ruta.delete as any).mockResolvedValue({});
      const res = await request(app).delete('/1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('DELETE /:id handles 500 error', async () => {
      (prisma.ruta.delete as any).mockRejectedValue(new Error('Err'));
      const res = await request(app).delete('/1').set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(500);
    });

    it('POST /:id/detalles and DELETE /detalles/:id', async () => {
      (prisma.rutaDetalle.create as any).mockResolvedValue({ id_detalle: 10 });
      const resCreate = await request(app).post('/1/detalles').set('Authorization', `Bearer ${adminToken}`).send({
        orden: 1, instruccion: 'Derecho 20m', latitud: 20.6, longitud: -100.4,
      });
      expect(resCreate.status).toBe(201);

      (prisma.rutaDetalle.delete as any).mockResolvedValue({});
      const resDelete = await request(app).delete('/detalles/10').set('Authorization', `Bearer ${adminToken}`);
      expect(resDelete.status).toBe(200);
    });

    it('Route details endpoints handle 500 error', async () => {
      (prisma.rutaDetalle.create as any).mockRejectedValue(new Error('Err'));
      const res500_1 = await request(app).post('/1/detalles').set('Authorization', `Bearer ${adminToken}`).send({
        orden: 1, instruccion: 'Derecho 20m', latitud: 20.6, longitud: -100.4,
      });
      expect(res500_1.status).toBe(500);

      (prisma.rutaDetalle.delete as any).mockRejectedValue(new Error('Err'));
      const res500_2 = await request(app).delete('/detalles/10').set('Authorization', `Bearer ${adminToken}`);
      expect(res500_2.status).toBe(500);
    });

    it('GET /mapa/data returns geojson map data or 500', async () => {
      (prisma.edificio.findMany as any).mockResolvedValue([
        { id_edificio: 1, nombre: 'A', latitud: 20.6, longitud: -100.4, descripcion: 'Ed A' },
      ]);
      (prisma.caminoGeografico.findMany as any).mockResolvedValue([
        { id_camino: 2, tipo: 'peatonal', geometria: {} },
      ]);

      const res = await request(app).get('/mapa/data');
      expect(res.status).toBe(200);
      expect(res.body.type).toBe('FeatureCollection');

      (prisma.edificio.findMany as any).mockRejectedValue(new Error('Err'));
      const res500 = await request(app).get('/mapa/data');
      expect(res500.status).toBe(500);
    });

    it('POST /google/compute-route computes routes or handles missing coords/error', async () => {
      const res400 = await request(app).post('/google/compute-route').set('Authorization', `Bearer ${adminToken}`).send({});
      expect(res400.status).toBe(400);

      const globalFetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ routes: [{ distanceMeters: 500 }] }),
      } as Response);

      const res = await request(app).post('/google/compute-route').set('Authorization', `Bearer ${adminToken}`).send({
        originCoords: { latitude: 20.6, longitude: -100.4 },
        destinationCoords: { latitude: 20.7, longitude: -100.5 },
      });
      expect(res.status).toBe(200);

      globalFetchMock.mockImplementationOnce(() => Promise.resolve({ ok: false } as Response));
      const res500 = await request(app).post('/google/compute-route').set('Authorization', `Bearer ${adminToken}`).send({
        originCoords: { latitude: 20.6, longitude: -100.4 },
        destinationCoords: { latitude: 20.7, longitude: -100.5 },
      });
      expect(res500.status).toBe(500);

      globalFetchMock.mockRestore();
    });

    it('POST /check-congestion checks route congestion or handles 400/500', async () => {
      const res400 = await request(app).post('/check-congestion').send({});
      expect(res400.status).toBe(400);

      const res = await request(app).post('/check-congestion').send({ id_ruta: 1 });
      expect(res.status).toBe(200);
      expect(res.body.congested).toBe(true);

      const { predecirCongestionRuta } = await import('../../lib/congestionNeurona.js');
      (predecirCongestionRuta as any).mockRejectedValueOnce(new Error('Err'));
      const res500 = await request(app).post('/check-congestion').send({ id_ruta: 1 });
      expect(res500.status).toBe(500);
    });

    it('GET /heatmap returns heatmap data or 500', async () => {
      (prisma.ruta.findMany as any).mockResolvedValue([
        { id_ruta: 1, detalles: [{ latitud: 20.6, longitud: -100.4 }] },
      ]);

      const res = await request(app).get('/heatmap');
      expect(res.status).toBe(200);
      expect(res.body[0].score).toBe(0.85);

      (prisma.ruta.findMany as any).mockRejectedValue(new Error('Err'));
      const res500 = await request(app).get('/heatmap');
      expect(res500.status).toBe(500);
    });
  });
});
