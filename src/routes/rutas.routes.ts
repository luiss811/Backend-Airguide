import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { createRutaSchema, updateRutaSchema, createRutaDetalleSchema } from '../validators/ruta.validator.js';

const router = Router();

// Get rutas
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, activo, origen_tipo, destino_tipo } = req.query;

    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo === 'true';
    if (origen_tipo) where.origen_tipo = origen_tipo;
    if (destino_tipo) where.destino_tipo = destino_tipo;

    const rutas = await prisma.ruta.findMany({
      where,
      include: {
        detalles: {
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { id_ruta: 'desc' },
    });

    return res.json(rutas);
  } catch (error) {
    console.error('Get rutas error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get detalles de ruta
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: Number(id) },
      include: {
        detalles: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    return res.json(ruta);
  } catch (error) {
    console.error('Error al obtener la ruta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Encontrar ruta entre origen y destino
router.post('/find', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { origen_tipo, origen_id, destino_tipo, destino_id } = req.body;

    if (!origen_tipo || !origen_id || !destino_tipo || !destino_id) {
      return res.status(400).json({ error: 'Se requieren origen y destino' });
    }

    const ruta = await prisma.ruta.findFirst({
      where: {
        origen_tipo,
        origen_id: parseInt(origen_id),
        destino_tipo,
        destino_id: parseInt(destino_id),
        activo: true,
      },
      include: {
        detalles: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!ruta) {
      return res.status(404).json({ error: 'No se encontró una ruta entre estos puntos' });
    }

    return res.json(ruta);
  } catch (error) {
    console.error('Error al encontrar la ruta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create ruta
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createRutaSchema.parse(req.body);

    // Crear la ruta con sus detalles si se proporcionan
    const ruta = await prisma.ruta.create({
      data: {
        tipo: data.tipo,
        origen_tipo: data.origen_tipo,
        origen_id: data.origen_id,
        destino_tipo: data.destino_tipo,
        destino_id: data.destino_id,
        tiempo_estimado: data.tiempo_estimado,
        activo: data.activo ?? true,
        detalles: data.detalles ? {
          create: data.detalles,
        } : undefined,
      },
      include: {
        detalles: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return res.status(201).json(ruta);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error al crear la ruta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update ruta
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateRutaSchema.parse(req.body);

    const existingRuta = await prisma.ruta.findUnique({
      where: { id_ruta: Number(id) },
    });

    if (!existingRuta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    const ruta = await prisma.ruta.update({
      where: { id_ruta: Number(id) },
      data,
      include: {
        detalles: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return res.json(ruta);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error al actualizar la ruta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete ruta
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingRuta = await prisma.ruta.findUnique({
      where: { id_ruta: Number(id) },
    });

    if (!existingRuta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    await prisma.ruta.delete({
      where: { id_ruta: Number(id) },
    });

    return res.json({ message: 'Ruta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la ruta:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agrega detalle a ruta
router.post('/:id/detalles', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createRutaDetalleSchema.parse(req.body);

    const ruta = await prisma.ruta.findUnique({
      where: { id_ruta: Number(id) },
    });

    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    const detalle = await prisma.rutaDetalle.create({
      data: {
        id_ruta: Number(id),
        orden: data.orden,
        instruccion: data.instruccion,
        latitud: data.latitud,
        longitud: data.longitud,
      },
    });

    return res.status(201).json(detalle);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Error al agregar los detalles:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete detalle de ruta
router.delete('/detalles/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingDetalle = await prisma.rutaDetalle.findUnique({
      where: { id_detalle: Number(id) },
    });

    if (!existingDetalle) {
      return res.status(404).json({ error: 'Detalle no encontrado' });
    }

    await prisma.rutaDetalle.delete({
      where: { id_detalle: Number(id) },
    });

    return res.json({ message: 'Detalles modificados' });
  } catch (error) {
    console.error('Error al eliminar los detalles:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
