import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { createRutaSchema, updateRutaSchema, createRutaDetalleSchema } from '../../validators/ruta.validator.js';
const app = express();
app.use(express.json());
app.get('/', async (req, res) => {
    try {
        const { tipo, activo, origen_tipo, destino_tipo } = req.query;
        const where = {};
        if (tipo)
            where.tipo = tipo;
        if (activo !== undefined)
            where.activo = activo === 'true';
        if (origen_tipo)
            where.origen_tipo = origen_tipo;
        if (destino_tipo)
            where.destino_tipo = destino_tipo;
        const rutas = await prisma.ruta.findMany({
            where, include: { detalles: { orderBy: { orden: 'asc' } } }, orderBy: { id_ruta: 'desc' },
        });
        return res.json(rutas);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.get('/:id(\\d+)', async (req, res) => {
    try {
        const { id } = req.params;
        const ruta = await prisma.ruta.findUnique({ where: { id_ruta: Number(id) }, include: { detalles: { orderBy: { orden: 'asc' } } } });
        if (!ruta)
            return res.status(404).json({ error: 'Ruta no encontrada' });
        return res.json(ruta);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.post('/find', authenticate, async (req, res) => {
    try {
        const { origen_tipo, origen_id, destino_tipo, destino_id } = req.body;
        if (!origen_tipo || !origen_id || !destino_tipo || !destino_id)
            return res.status(400).json({ error: 'Se requieren origen y destino' });
        const ruta = await prisma.ruta.findFirst({
            where: { origen_tipo, origen_id: parseInt(origen_id), destino_tipo, destino_id: parseInt(destino_id), activo: true },
            include: { detalles: { orderBy: { orden: 'asc' } } },
        });
        if (!ruta)
            return res.status(404).json({ error: 'No se encontró una ruta' });
        return res.json(ruta);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const data = createRutaSchema.parse(req.body);
        const ruta = await prisma.ruta.create({
            data: {
                tipo: data.tipo, origen_tipo: data.origen_tipo, origen_id: data.origen_id,
                destino_tipo: data.destino_tipo, destino_id: data.destino_id, tiempo_estimado: data.tiempo_estimado,
                activo: data.activo ?? true, detalles: data.detalles ? { create: data.detalles } : undefined,
            },
            include: { detalles: { orderBy: { orden: 'asc' } } },
        });
        return res.status(201).json(ruta);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.put('/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateRutaSchema.parse(req.body);
        const ruta = await prisma.ruta.update({
            where: { id_ruta: Number(id) }, data, include: { detalles: { orderBy: { orden: 'asc' } } },
        });
        return res.json(ruta);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.delete('/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.ruta.delete({ where: { id_ruta: Number(id) } });
        return res.json({ message: 'Ruta eliminada' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.post('/:id(\\d+)/detalles', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = createRutaDetalleSchema.parse(req.body);
        const detalle = await prisma.rutaDetalle.create({
            data: { id_ruta: Number(id), orden: data.orden, instruccion: data.instruccion, latitud: data.latitud, longitud: data.longitud },
        });
        return res.status(201).json(detalle);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.delete('/detalles/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.rutaDetalle.delete({ where: { id_detalle: Number(id) } });
        return res.json({ message: 'Detalle eliminado' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.get('/mapa/data', async (req, res) => {
    try {
        const edificios = await prisma.edificio.findMany({ where: { activo: true } });
        const caminos = await prisma.caminoGeografico.findMany({ where: { activo: true } });
        const geojson = {
            type: "FeatureCollection",
            features: [
                ...edificios.map(b => ({
                    type: "Feature", properties: { name: b.nombre, type: 'building', id: b.id_edificio, descripcion: b.descripcion },
                    geometry: { type: "Point", coordinates: [Number(b.longitud), Number(b.latitud)] }
                })),
                ...caminos.map(c => ({
                    type: "Feature", properties: { type: c.tipo, id: c.id_camino }, geometry: c.geometria
                }))
            ]
        };
        res.json(geojson);
    }
    catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al cargar mapas' });
    }
});
app.post('/google/compute-route', authenticate, async (req, res) => {
    try {
        const { originCoords, destinationCoords, routingPreference = 'TRAFFIC_UNAWARE' } = req.body;
        if (!originCoords || !destinationCoords)
            return res.status(400).json({ error: 'Faltan coordenadas' });
        const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline' },
            body: JSON.stringify({
                origin: { location: { latLng: originCoords } }, destination: { location: { latLng: destinationCoords } },
                travelMode: 'WALK', routingPreference, computeAlternativeRoutes: false, languageCode: 'es-MX', units: 'METRIC'
            })
        });
        const data = await response.json();
        if (!response.ok)
            throw new Error('Error en Google Maps API');
        return res.json(data);
    }
    catch (error) {
        return res.status(500).json({ error: 'No se pudo calcular la ruta' });
    }
});
const PORT = process.env.PORT_NAVIGATION || 3014;
app.listen(PORT, () => console.log(`Navigation Service running on port ${PORT}`));
//# sourceMappingURL=index.js.map