import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { createEventoSchema, updateEventoSchema } from '../validators/evento.validator.js';
import { evaluarEvento, entrenarNeurona } from '../lib/eventoNeurona.js';

const router = Router();

// Entrenar Neurona
router.post('/entrenar-neurona', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const history = await entrenarNeurona();
    return res.json({ success: true, history });
  } catch (error) {
    console.error('Error entrenando neurona:', error);
    return res.status(500).json({ error: 'Error interno al entrenar la red neuronal' });
  }
});

// Get eventos mapa visitantes
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { publico, activo } = req.query;

    const where: any = {};
    if (publico !== undefined) where.publico = publico === 'true';
    if (activo !== undefined) where.activo = activo === 'true';

    const eventos = await prisma.evento.findMany({
      where,
      include: {
        edificio: {
          select: {
            id_edificio: true,
            nombre: true,
            tipo: true,
            latitud: true,
            longitud: true,
          },
        },
      },
      orderBy: { fecha_inicio: 'asc' },
    });

    return res.json(eventos);
  } catch (error) {
    console.error('Get eventos error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get evento mapa visitantes
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id_evento: Number(id) },
      include: {
        edificio: true,
      },
    });

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    return res.json(evento);
  } catch (error) {
    console.error('Get evento error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create evento
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventoSchema.parse(req.body);

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id_edificio: data.id_edificio },
    });

    if (!edificio) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    const creadorId = data.id_creador ? data.id_creador : Number(req.user!.userId);
    const usuarioCreador = await prisma.usuario.findUnique({
      where: { id_usuario: creadorId }
    });
    
    // Obtener prioridad
    let prioridadVal = data.prioridad_evento || usuarioCreador?.prioridad || 3;
    if (!data.prioridad_evento) {
      if (usuarioCreador?.rol === 'rector') prioridadVal = 4;
      else if (usuarioCreador?.rol === 'profesor') prioridadVal = 3;
    }

    // Evaluacion de IA / Desplazamiento
    const evaluacion = await evaluarEvento({
      ...data,
      prioridad: prioridadVal
    });

    if (!evaluacion.permitir) {
      return res.status(409).json({ error: evaluacion.mensaje });
    }

    const evento = await prisma.evento.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
        id_edificio: data.id_edificio,
        publico: data.publico ?? true,
        activo: data.activo ?? true,
        id_creador: creadorId,
        prioridad_evento: prioridadVal,
      },
      include: {
        edificio: true,
      },
    });

    if (evaluacion.tipo === "DESPLAZAMIENTO_REALIZADO") {
       (evento as any).warning = "Evento creado exitosamente. Algunos eventos de menor prioridad en este recito fueron reubicados por nuestro modelo de IA y sus dueños han sido notificados.";
    }

    return res.status(201).json(evento);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create evento error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update evento
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateEventoSchema.parse(req.body);

    const existingEvento = await prisma.evento.findUnique({
      where: { id_evento: Number(id) },
    });

    if (!existingEvento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Si se cambia el edificio, verificar que existe
    if (data.id_edificio) {
      const edificio = await prisma.edificio.findUnique({
        where: { id_edificio: data.id_edificio },
      });

      if (!edificio) {
        return res.status(404).json({ error: 'Edificio no encontrado' });
      }
    }

    const updateData: any = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.fecha_inicio) updateData.fecha_inicio = new Date(data.fecha_inicio);
    if (data.fecha_fin) updateData.fecha_fin = new Date(data.fecha_fin);
    if (data.id_edificio) updateData.id_edificio = data.id_edificio;
    if (data.publico !== undefined) updateData.publico = data.publico;
    if (data.activo !== undefined) updateData.activo = data.activo;
    if (data.id_creador !== undefined) updateData.id_creador = data.id_creador;
    if (data.prioridad_evento !== undefined) updateData.prioridad_evento = data.prioridad_evento;

    // Obtener prioridad
    const creadorId = data.id_creador !== undefined ? data.id_creador : existingEvento.id_creador;
    const usuarioCreador = await prisma.usuario.findUnique({
      where: { id_usuario: creadorId }
    });
    let prioridadVal = data.prioridad_evento !== undefined ? data.prioridad_evento : existingEvento.prioridad_evento;

    // Evaluacion de IA / Desplazamiento si cambian horarios/lugar
    if (data.fecha_inicio || data.fecha_fin || data.id_edificio) {
       const dummyEvento = {
         ...existingEvento,
         ...updateData,
         prioridad: prioridadVal
       };
       const evaluacion = await evaluarEvento(dummyEvento);
       if (!evaluacion.permitir) {
          return res.status(409).json({ error: evaluacion.mensaje });
       }
    }

    const evento = await prisma.evento.update({
      where: { id_evento: Number(id) },
      data: updateData,
      include: {
        edificio: true,
      },
    });

    return res.json(evento);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update evento error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete evento
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingEvento = await prisma.evento.findUnique({
      where: { id_evento: Number(id) },
    });

    if (!existingEvento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    await prisma.evento.delete({
      where: { id_evento: Number(id) },
    });

    return res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Delete evento error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
