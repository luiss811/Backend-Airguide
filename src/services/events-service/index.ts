import express, { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth.middleware.js';
import { createEventoSchema, updateEventoSchema } from '../../validators/evento.validator.js';
import { evaluarEvento, entrenarNeurona } from '../../lib/eventoNeurona.js';

const app = express();
app.use(express.json());

app.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { publico, activo } = req.query;
    const where: any = {};
    if (publico !== undefined) where.publico = publico === 'true';
    if (activo !== undefined) where.activo = activo === 'true';

    const eventos = await prisma.evento.findMany({
      where,
      include: { edificio: { select: { id_edificio: true, nombre: true, tipo: true, latitud: true, longitud: true } } },
      orderBy: { fecha_inicio: 'asc' },
    });
    return res.json(eventos);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/:id(\\d+)', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const evento = await prisma.evento.findUnique({ where: { id_evento: Number(id) }, include: { edificio: true } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });
    return res.json(evento);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventoSchema.parse(req.body);
    const creadorId = parseInt(req.user!.userId);
    const usuarioCreador = await prisma.usuario.findUnique({ where: { id_usuario: creadorId } });
    let prioridadVal = data.prioridad_evento;
    if (prioridadVal === undefined) {
      prioridadVal = usuarioCreador?.prioridad || 3;
      if (usuarioCreador?.rol === 'rector') prioridadVal = 4;
      else if (usuarioCreador?.rol === 'profesor') prioridadVal = 3;
    }

    const evaluacion = await evaluarEvento({ ...data, prioridad_evento: prioridadVal });
    if (!evaluacion.permitir) return res.status(409).json({ error: evaluacion.mensaje });

    const evento = await prisma.evento.create({
      data: {
        nombre: data.nombre, descripcion: data.descripcion,
        fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : new Date(),
        fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : new Date(),
        id_edificio: data.id_edificio, publico: data.publico ?? true, activo: data.activo ?? true,
        id_creador: creadorId, prioridad_evento: prioridadVal,
        total_invitados: data.total_invitados ?? 0
      },
      include: { edificio: true },
    });

    const responsePayload = { ...evento } as any;
    if (evaluacion.tipo === "DESPLAZAMIENTO_REALIZADO") responsePayload.warning = "El evento fue agendado desplazando otros.";
    return res.status(201).json(responsePayload);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors[0].message });
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.put('/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateEventoSchema.parse(req.body);
    const existingEvento = await prisma.evento.findUnique({ where: { id_evento: Number(id) } });
    if (!existingEvento) return res.status(404).json({ error: 'Evento no encontrado' });

    const creadorId = Number(req.user!.userId);
    const usuarioCreador = await prisma.usuario.findUnique({ where: { id_usuario: creadorId } });
    let prioridadVal = data.prioridad_evento;
    if (prioridadVal === undefined) {
      prioridadVal = usuarioCreador?.prioridad || 3;
    }

    if (data.fecha_inicio || data.fecha_fin || data.id_edificio) {
       const dummyEvento = { ...existingEvento, ...data, prioridad_evento: prioridadVal };
       const evaluacion = await evaluarEvento(dummyEvento as any);
       if (!evaluacion.permitir) return res.status(409).json({ error: evaluacion.mensaje });
    }

    if (data.fecha_inicio) data.fecha_inicio = new Date(data.fecha_inicio) as any;
    if (data.fecha_fin) data.fecha_fin = new Date(data.fecha_fin) as any;

    const evento = await prisma.evento.update({
      where: { id_evento: Number(id) }, data: data as any, include: { edificio: true },
    });
    return res.json(evento);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.delete('/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.evento.delete({ where: { id_evento: Number(id) } });
    return res.json({ message: 'Evento eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/entrenar-neurona', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await entrenarNeurona();
    return res.json({ success: true, history: result });
  } catch (error: any) {
    console.error("Error entrenando neurona:", error);
    return res.status(500).json({ error: 'Error interno al entrenar neurona' });
  }
});

// Endpoint público para confirmar asistencia mediante código QR
app.post('/:id(\\d+)/confirmar-asistencia', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const evento = await prisma.evento.findUnique({ where: { id_evento: Number(id) } });
    if (!evento) return res.status(404).json({ error: 'Evento no encontrado' });

    const actualizado = await prisma.evento.update({
      where: { id_evento: Number(id) },
      data: {
        asistentes_confirmados: {
          increment: 1
        }
      }
    });

    return res.json({ message: 'Asistencia confirmada', asistentes_confirmados: actualizado.asistentes_confirmados });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno al confirmar asistencia' });
  }
});

const PORT = process.env.PORT_EVENTS || 3013;
app.listen(PORT, () => console.log('Servicio de Eventos corriendo'));
