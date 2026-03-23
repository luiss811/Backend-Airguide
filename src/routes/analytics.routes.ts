import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get dashboard estadisticas
router.get('/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsuarios,
      usuariosActivos,
      usuariosPendientes,
      totalEdificios,
      edificiosActivos,
      totalSalones,
      totalProfesores,
      totalCubiculos,
      totalEventos,
      eventosActivos,
      totalRutas,
      rutasActivas,
      totalLogs,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estado: 'activo' } }),
      prisma.usuario.count({ where: { estado: 'pendiente' } }),
      prisma.edificio.count(),
      prisma.edificio.count({ where: { activo: true } }),
      prisma.salon.count(),
      prisma.profesor.count(),
      prisma.cubiculo.count(),
      prisma.evento.count(),
      prisma.evento.count({ where: { activo: true } }),
      prisma.ruta.count(),
      prisma.ruta.count({ where: { activo: true } }),
      prisma.logAcceso.count(),
    ]);

    return res.json({
      usuarios: {
        total: totalUsuarios,
        activos: usuariosActivos,
        pendientes: usuariosPendientes,
      },
      edificios: {
        total: totalEdificios,
        activos: edificiosActivos,
      },
      salones: totalSalones,
      profesores: totalProfesores,
      cubiculos: totalCubiculos,
      eventos: {
        total: totalEventos,
        activos: eventosActivos,
      },
      rutas: {
        total: totalRutas,
        activas: rutasActivas,
      },
      totalAccesos: totalLogs,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Edificios por tipo
router.get('/edificios-tipo', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const edificiosPorTipo = await prisma.edificio.groupBy({
      by: ['tipo'],
      _count: {
        id_edificio: true,
      },
      where: {
        activo: true,
      },
    });

    const result = edificiosPorTipo.map(item => ({
      tipo: item.tipo,
      cantidad: item._count.id_edificio,
    }));

    return res.json(result);
  } catch (error) {
    console.error('Get edificios por tipo error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eventos próximos
router.get('/eventos-proximos', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    const eventos = await prisma.evento.findMany({
      where: {
        fecha_inicio: {
          gte: now,
          lte: futureDate,
        },
        activo: true,
      },
      include: {
        edificio: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { fecha_inicio: 'asc' },
      take: 10,
    });

    return res.json(eventos);
  } catch (error) {
    console.error('Get eventos próximos error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Logs de acceso recientes
router.get('/accesos-recientes', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = '7' } = req.query;
    const daysNumber = parseInt(days as string);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);

    const accesos = await prisma.logAcceso.findMany({
      where: {
        fecha: {
          gte: startDate,
        },
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            correo: true,
            rol: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 50,
    });

    return res.json(accesos);
  } catch (error) {
    console.error('Get accesos recientes error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Accesos por día
router.get('/accesos-timeline', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysNumber = parseInt(days as string);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);

    const accesos = await prisma.logAcceso.findMany({
      where: {
        fecha: {
          gte: startDate,
        },
      },
      select: {
        fecha: true,
      },
    });

    // Agrupar por día
    const accesosPorDia = accesos.reduce((acc, curr) => {
      const date = curr.fecha.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = Object.entries(accesosPorDia).map(([fecha, count]) => ({
      fecha,
      accesos: count,
    }));

    return res.json(result);
  } catch (error) {
    console.error('Get accesos timeline error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Usuarios por rol
router.get('/usuarios-rol', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const usuariosPorRol = await prisma.usuario.groupBy({
      by: ['rol', 'estado'],
      _count: {
        id_usuario: true,
      },
    });

    const result = usuariosPorRol.map(item => ({
      rol: item.rol,
      estado: item.estado,
      cantidad: item._count.id_usuario,
    }));

    return res.json(result);
  } catch (error) {
    console.error('Get usuarios por rol error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas más populares
router.get('/rutas-populares', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const rutas = await prisma.ruta.findMany({
      where: {
        activo: true,
      },
      select: {
        id_ruta: true,
        tipo: true,
        origen_tipo: true,
        origen_id: true,
        destino_tipo: true,
        destino_id: true,
        tiempo_estimado: true,
      },
      take: 10,
    });

    return res.json(rutas);
  } catch (error) {
    console.error('Get rutas populares error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
