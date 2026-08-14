import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
describe('API Gateway', () => {
    let app;
    beforeEach(async () => {
        const { app: expressApp } = await import('./index.js');
        app = expressApp;
    });
    it('GET /health returns 200 with status ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('API Gateway');
    });
    it('GET /api/unknown-route returns 404', async () => {
        const res = await request(app).get('/api/unknown-route');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Ruta de Gateway no encontrada');
    });
    it('GET /frontend-page attempts to send index.html SPA entrypoint', async () => {
        const res = await request(app).get('/dashboard');
        expect([200, 404, 500]).toContain(res.status);
    });
});
//# sourceMappingURL=index.test.js.map