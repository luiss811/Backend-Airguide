import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { createEdificioSchema, updateEdificioSchema } from '../validators/edificio.validator.js';

const router = Router();

// Get all edificios (public)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, activo } = req.query;

    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo === 'true';

    const edificios = await prisma.edificio.findMany({
      where,
      include: {
        _count: {
          select: {
            salones: true,
            cubiculos: true,
            eventos: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return res.json(edificios);
  } catch (error) {
    console.error('Get edificios error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single edificio (public)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const edificio = await prisma.edificio.findUnique({
      where: { id_edificio: parseInt(id) },
      include: {
        salones: {
          where: { activo: true },
          orderBy: { piso: 'asc' },
        },
        cubiculos: {
          where: { activo: true },
          include: {
            profesor: true,
          },
          orderBy: { piso: 'asc' },
        },
        eventos: {
          where: {
            activo: true,
            fecha_inicio: { gte: new Date() },
          },
          orderBy: { fecha_inicio: 'asc' },
        },
      },
    });

    if (!edificio) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    return res.json(edificio);
  } catch (error) {
    console.error('Get edificio error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create edificio (admin only)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createEdificioSchema.parse(req.body);

    const edificio = await prisma.edificio.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        latitud: data.latitud,
        longitud: data.longitud,
        tipo: data.tipo,
        activo: data.activo ?? true,
      },
    });

    return res.status(201).json(edificio);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create edificio error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update edificio (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateEdificioSchema.parse(req.body);

    const existingEdificio = await prisma.edificio.findUnique({
      where: { id_edificio: parseInt(id) },
    });

    if (!existingEdificio) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    const edificio = await prisma.edificio.update({
      where: { id_edificio: parseInt(id) },
      data,
    });

    return res.json(edificio);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update edificio error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Delete edificio (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingEdificio = await prisma.edificio.findUnique({
      where: { id_edificio: parseInt(id) },
    });

    if (!existingEdificio) {
      return res.status(404).json({ error: 'Edificio no encontrado' });
    }

    await prisma.edificio.delete({
      where: { id_edificio: parseInt(id) },
    });

    return res.json({ message: 'Edificio eliminado exitosamente' });
  } catch (error) {
    console.error('Delete edificio error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
