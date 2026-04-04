import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { createEventoSchema, updateEventoSchema } from '../../validators/evento.validator.js';
import { evaluarEvento } from '../../lib/eventoNeurona.js';
const app = express();
app.use(express.json());
app.get('/', async (req, res) => {
    try {
        const { publico, activo } = req.query;
        const where = {};
        if (publico !== undefined)
            where.publico = publico === 'true';
        if (activo !== undefined)
            where.activo = activo === 'true';
        const eventos = await prisma.evento.findMany({
            where,
            include: { edificio: { select: { id_edificio: true, nombre: true, tipo: true, latitud: true, longitud: true } } },
            orderBy: { fecha_inicio: 'asc' },
        });
        return res.json(eventos);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.get('/:id(\\d+)', async (req, res) => {
    try {
        const { id } = req.params;
        const evento = await prisma.evento.findUnique({ where: { id_evento: Number(id) }, include: { edificio: true } });
        if (!evento)
            return res.status(404).json({ error: 'Evento no encontrado' });
        return res.json(evento);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const data = createEventoSchema.parse(req.body);
        const creadorId = parseInt(req.user.userId);
        const usuarioCreador = await prisma.usuario.findUnique({ where: { id_usuario: creadorId } });
        let prioridadVal = usuarioCreador?.prioridad || 3;
        if (usuarioCreador?.rol === 'rector')
            prioridadVal = 4;
        else if (usuarioCreador?.rol === 'profesor')
            prioridadVal = 3;
        const evaluacion = await evaluarEvento({ ...data, prioridad: prioridadVal });
        if (!evaluacion.permitir)
            return res.status(409).json({ error: evaluacion.mensaje });
        const evento = await prisma.evento.create({
            data: {
                nombre: data.nombre, descripcion: data.descripcion,
                fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : new Date(),
                fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : new Date(),
                id_edificio: data.id_edificio, publico: data.publico ?? true, activo: data.activo ?? true,
                id_creador: creadorId, prioridad_evento: prioridadVal
            },
            include: { edificio: true },
        });
        const responsePayload = { ...evento };
        if (evaluacion.tipo === "DESPLAZAMIENTO_REALIZADO")
            responsePayload.warning = "El evento fue agendado desplazando otros.";
        return res.status(201).json(responsePayload);
    }
    catch (error) {
        if (error.name === 'ZodError')
            return res.status(400).json({ error: error.errors[0].message });
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.put('/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateEventoSchema.parse(req.body);
        const existingEvento = await prisma.evento.findUnique({ where: { id_evento: Number(id) } });
        if (!existingEvento)
            return res.status(404).json({ error: 'Evento no encontrado' });
        const creadorId = Number(req.user.userId);
        const usuarioCreador = await prisma.usuario.findUnique({ where: { id_usuario: creadorId } });
        let prioridadVal = usuarioCreador?.prioridad || 3;
        if (data.fecha_inicio || data.fecha_fin || data.id_edificio) {
            const dummyEvento = { ...existingEvento, ...data, prioridad: prioridadVal };
            const evaluacion = await evaluarEvento(dummyEvento);
            if (!evaluacion.permitir)
                return res.status(409).json({ error: evaluacion.mensaje });
        }
        const evento = await prisma.evento.update({
            where: { id_evento: Number(id) }, data: data, include: { edificio: true },
        });
        return res.json(evento);
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
app.delete('/:id(\\d+)', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.evento.delete({ where: { id_evento: Number(id) } });
        return res.json({ message: 'Evento eliminado' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Error interno' });
    }
});
const PORT = process.env.PORT_EVENTS || 3013;
app.listen(PORT, () => console.log(`Events Service running on port ${PORT}`));
//# sourceMappingURL=index.js.map