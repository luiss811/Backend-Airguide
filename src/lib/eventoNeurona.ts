import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function evaluarEvento(nuevoEvento: any) {

  const eventos = await prisma.evento.findMany({
    where: {
      ubicacion_id: nuevoEvento.ubicacion_id,
      fecha: new Date(nuevoEvento.fecha)
    }
  });

  for (const evento of eventos) {

    const hayConflicto =
      (new Date(nuevoEvento.hora_inicio) < evento.hora_fin &&
       new Date(nuevoEvento.hora_fin) > evento.hora_inicio);

    if (hayConflicto) {

      if (nuevoEvento.prioridad > evento.prioridad) {

        // 🔔 notificación
        await prisma.notificacion.create({
          data: {
            usuario_id: evento.usuario_id,
            mensaje: `Tu evento "${evento.nombre}" fue desplazado por uno de mayor prioridad`
          }
        });

        return {
          permitir: true,
          tipo: "PRIORIDAD_ALTA"
        };

      } else {

        return {
          permitir: false,
          mensaje: "Hay un evento con mayor prioridad en ese horario"
        };
      }
    }
  }

  return {
    permitir: true,
    tipo: "SIN_CONFLICTO"
  };
}