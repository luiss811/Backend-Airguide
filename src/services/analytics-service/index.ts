import express, { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth.middleware.js';

const app = express();
app.use(express.json());

app.get('/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsuarios, usuariosActivos, usuariosPendientes, totalEdificios, edificiosActivos,
      totalSalones, totalProfesores, totalCubiculos, totalEventos, eventosActivos, totalRutas, rutasActivas, totalLogs
    ] = await Promise.all([
      prisma.usuario.count(), prisma.usuario.count({ where: { estado: 'activo' } }), prisma.usuario.count({ where: { estado: 'pendiente' } }),
      prisma.edificio.count(), prisma.edificio.count({ where: { activo: true } }), prisma.salon.count(),
      prisma.profesor.count(), prisma.cubiculo.count(), prisma.evento.count(), prisma.evento.count({ where: { activo: true } }),
      prisma.ruta.count(), prisma.ruta.count({ where: { activo: true } }), prisma.logAcceso.count(),
    ]);

    return res.json({
      usuarios: { total: totalUsuarios, activos: usuariosActivos, pendientes: usuariosPendientes },
      edificios: { total: totalEdificios, activos: edificiosActivos },
      salones: totalSalones, profesores: totalProfesores, cubiculos: totalCubiculos,
      eventos: { total: totalEventos, activos: eventosActivos }, rutas: { total: totalRutas, activas: rutasActivas },
      totalAccesos: totalLogs,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/edificios-tipo', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const edificiosPorTipo = await prisma.edificio.groupBy({ by: ['tipo'], _count: { id_edificio: true }, where: { activo: true } });
    return res.json(edificiosPorTipo.map(item => ({ tipo: item.tipo, cantidad: item._count.id_edificio })));
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/eventos-proximos', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const futureDate = new Date(); futureDate.setMonth(futureDate.getMonth() + 3);
    const eventos = await prisma.evento.findMany({
      where: { fecha_inicio: { gte: new Date(), lte: futureDate }, activo: true },
      include: { edificio: { select: { nombre: true } } }, orderBy: { fecha_inicio: 'asc' }, take: 10,
    });
    return res.json(eventos);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/accesos-recientes', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const startDate = new Date(); startDate.setDate(startDate.getDate() - parseInt((req.query.days as string) || '7'));
    const accesos = await prisma.logAcceso.findMany({
      where: { fecha: { gte: startDate } }, include: { usuario: { select: { nombre: true, correo: true, rol: true } } },
      orderBy: { fecha: 'desc' }, take: 50,
    });
    return res.json(accesos);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/accesos-timeline', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const startDate = new Date(); startDate.setDate(startDate.getDate() - parseInt((req.query.days as string) || '30'));
    const accesos = await prisma.logAcceso.findMany({ where: { fecha: { gte: startDate } }, select: { fecha: true } });
    const accesosPorDia = accesos.reduce((acc, curr) => {
      const date = curr.fecha.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1; return acc;
    }, {} as Record<string, number>);
    return res.json(Object.entries(accesosPorDia).map(([fecha, count]) => ({ fecha, accesos: count })));
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/usuarios-rol', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const usuariosPorRol = await prisma.usuario.groupBy({ by: ['rol', 'estado'], _count: { id_usuario: true } });
    return res.json(usuariosPorRol.map(item => ({ rol: item.rol, estado: item.estado, cantidad: item._count.id_usuario })));
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/rutas-populares', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const rutas = await prisma.ruta.findMany({
      where: { activo: true },
      select: { id_ruta: true, tipo: true, origen_tipo: true, origen_id: true, destino_tipo: true, destino_id: true, tiempo_estimado: true },
      take: 10,
    });
    return res.json(rutas);
  } catch (error) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

const PORT = process.env.PORT_ANALYTICS || 3015;
app.listen(PORT, () => console.log('Servicio de Analytics corriendo'));
