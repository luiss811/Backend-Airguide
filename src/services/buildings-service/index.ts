import express, { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth.middleware.js';
import { createEdificioSchema, updateEdificioSchema } from '../../validators/edificio.validator.js';

const app = express();
app.use(express.json());

// Get edificios
app.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, activo } = req.query;

    const where: any = {};
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo === 'true';

    const edificios = await prisma.edificio.findMany({
      where,
      include: {
        _count: {
          select: { salones: true, cubiculos: true, eventos: true },
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

// Get all salones
app.get('/salones', async (req: AuthRequest, res: Response) => {
  try {
    const salones = await prisma.salon.findMany({
      include: {
        edificio: {
          select: { id_edificio: true, nombre: true, tipo: true },
        },
      },
      orderBy: [ { id_edificio: 'asc' }, { piso: 'asc' } ],
    });

    return res.json(salones);
  } catch (error) {
    console.error('Get salones error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get edificio id
app.get('/:id(\\d+)', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const edificio = await prisma.edificio.findUnique({
      where: { id_edificio: Number(id) },
      include: {
        salones: { where: { activo: true }, orderBy: { piso: 'asc' } },
        cubiculos: {
          where: { activo: true },
          include: { profesor: true },
          orderBy: { piso: 'asc' },
        },
        eventos: {
          where: { activo: true, fecha_inicio: { gte: new Date() } },
          orderBy: { fecha_inicio: 'asc' },
        },
      },
    });

    if (!edificio) return res.status(404).json({ error: 'Edificio no encontrado' });
    return res.json(edificio);
  } catch (error) {
    console.error('Get edificio error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Create edificio
app.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createEdificioSchema.parse(req.body);
    const edificio = await prisma.edificio.create({
      data: {
        nombre: data.nombre, descripcion: data.descripcion,
        latitud: data.latitud, longitud: data.longitud,
        tipo: data.tipo, activo: data.activo ?? true,
      },
    });
    return res.status(201).json(edificio);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors[0].message });
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Update edificio
app.put('/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateEdificioSchema.parse(req.body);
    const existingEdificio = await prisma.edificio.findUnique({ where: { id_edificio: Number(id) } });

    if (!existingEdificio) return res.status(404).json({ error: 'Edificio no encontrado' });

    const edificio = await prisma.edificio.update({ where: { id_edificio: Number(id) }, data });
    return res.json(edificio);
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ error: error.errors[0].message });
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Delete edificio
app.delete('/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.edificio.delete({ where: { id_edificio: Number(id) } });
    return res.json({ message: 'Edificio eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Get salones by edificio
app.get('/:id(\\d+)/salones', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const salones = await prisma.salon.findMany({
      where: { id_edificio: Number(id) },
      orderBy: { piso: 'asc' },
    });
    return res.json(salones);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Create salon
app.post('/:id(\\d+)/salones', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, piso, tipo, activo } = req.body;
    const edificio = await prisma.edificio.findUnique({ where: { id_edificio: Number(id) } });
    if (!edificio) return res.status(404).json({ error: 'Edificio no encontrado' });

    const salon = await prisma.salon.create({
      data: { id_edificio: Number(id), nombre, piso, tipo, activo: activo !== undefined ? activo : true },
      include: { edificio: { select: { id_edificio: true, nombre: true, tipo: true } } },
    });
    return res.status(201).json(salon);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Update salon
app.put('/salones/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const salon = await prisma.salon.update({
      where: { id_salon: Number(id) }, data: updateData,
      include: { edificio: { select: { id_edificio: true, nombre: true, tipo: true } } }
    });
    return res.json(salon);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Delete salon
app.delete('/salones/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.salon.delete({ where: { id_salon: Number(id) } });
    return res.json({ message: 'Salón eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Get all profesores
app.get('/profesores', async (req: AuthRequest, res: Response) => {
  try {
    const profesor = await prisma.profesor.findMany({
      include: {
        usuario: { select: { nombre: true, correo: true } },
        cubiculos: { include: { edificio: { select: { id_edificio: true, nombre: true, latitud: true, longitud: true, tipo: true } } } },
      },
    });
    return res.json(profesor);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get single profesor
app.get('/profesores/:id(\\d+)', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const profesor = await prisma.profesor.findUnique({
      where: { id_profesor: Number(id) },
      include: {
        usuario: { select: { nombre: true, correo: true } },
        cubiculos: { include: { edificio: true } },
      },
    });
    if (!profesor) return res.status(404).json({ error: 'Profesor no encontrado' });
    return res.json(profesor);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Create profesor
app.post('/profesores', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id_usuario, departamento, id_cubiculo, activo } = req.body;
    await prisma.usuario.update({ where: { id_usuario: parseInt(id_usuario) }, data: { rol: 'profesor' } });
    const profesor = await prisma.profesor.create({
      data: { id_usuario: parseInt(id_usuario), departamento, activo: activo !== undefined ? activo : true },
      include: { usuario: { select: { nombre: true, correo: true } }, cubiculos: { include: { edificio: { select: { id_edificio: true, nombre: true } } } } }
    });
    if (id_cubiculo) {
      await prisma.cubiculo.update({ where: { id_cubiculo: parseInt(id_cubiculo) }, data: { id_profesor: profesor.id_profesor } });
    }
    return res.status(201).json(profesor);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Update profesor
app.put('/profesores/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const profesor = await prisma.profesor.update({
      where: { id_profesor: Number(id) }, data: { departamento: updateData.departamento, activo: updateData.activo },
      include: { usuario: { select: { nombre: true, correo: true } }, cubiculos: { include: { edificio: { select: { id_edificio: true, nombre: true } } } } }
    });
    if (updateData.id_cubiculo) {
      await prisma.cubiculo.update({ where: { id_cubiculo: parseInt(updateData.id_cubiculo) }, data: { id_profesor: profesor.id_profesor } });
    }
    return res.json(profesor);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// Delete profesor
app.delete('/profesores/:id(\\d+)', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.profesor.delete({ where: { id_profesor: Number(id) } });
    return res.json({ message: 'Profesor eliminado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

const PORT = process.env.PORT_BUILDINGS || 3012;
app.listen(PORT, () => console.log(`Buildings Service running on port ${PORT}`));
