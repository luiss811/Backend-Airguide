/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPidetRoutes() {
  console.log("== Creando rutas manuales truncadas de híbrido para todos los edificios -> PIDET ==");

  const pidet = await prisma.edificio.findFirst({
    where: { nombre: { contains: 'PIDET', mode: 'insensitive' } }
  });

  if (!pidet) {
    throw new Error('No se encontro el edificio PIDET');
  }

  const otrosEdificios = await prisma.edificio.findMany({
    where: { id_edificio: { not: pidet.id_edificio } }
  });

  const latDest = Number(pidet.latitud);
  const lngDest = Number(pidet.longitud);

  // Limpiar rutas previas para no tener duplicados. Conservamos la #4 (Auditorio manual original)
  await prisma.ruta.deleteMany({
    where: {
      OR: [
        { destino_id: pidet.id_edificio },
        { origen_id: pidet.id_edificio }
      ],
      destino_tipo: 'edificio',
      origen_tipo: 'edificio',
      id_ruta: { gt: 4 }
    }
  });

  for (const edificio of otrosEdificios) {
    const latOri = Number(edificio.latitud);
    const lngOri = Number(edificio.longitud);

    // Ruta: Edificio -> PIDET
    const existeIda = await prisma.ruta.findFirst({
      where: {
        origen_tipo: 'edificio',
        origen_id: edificio.id_edificio,
        destino_tipo: 'edificio',
        destino_id: pidet.id_edificio,
        tipo: 'interna'
      }
    });

    if (!existeIda) {
      const nuevaRutaIda = await prisma.ruta.create({
        data: {
          tipo: 'interna',
          origen_tipo: 'edificio',
          origen_id: edificio.id_edificio,
          destino_tipo: 'edificio',
          destino_id: pidet.id_edificio,
          tiempo_estimado: 2,
          activo: true,
          detalles: {
            create: [
              { orden: 1, instruccion: 'Llegada al punto de conexión', latitud: 20.656255, longitud: -100.404144 },
              { orden: 2, instruccion: 'Llegada al edificio PIDET', latitud: latDest, longitud: lngDest }
            ]
          }
        }
      });
      console.log(`Ruta creada exitosamente para ${edificio.nombre} -> PIDET (Ruta ID: ${nuevaRutaIda.id_ruta})`);
    } else {
      console.log(`La ruta para ${edificio.nombre} -> PIDET ya existe (Ruta ID: ${existeIda.id_ruta}).`);
    }

    // Ruta: PIDET -> Edificio
    const existeVuelta = await prisma.ruta.findFirst({
      where: {
        origen_tipo: 'edificio',
        origen_id: pidet.id_edificio,
        destino_tipo: 'edificio',
        destino_id: edificio.id_edificio,
        tipo: 'interna'
      }
    });

    if (!existeVuelta) {
      const nuevaRutaVuelta = await prisma.ruta.create({
        data: {
          tipo: 'interna',
          origen_tipo: 'edificio',
          origen_id: pidet.id_edificio,
          destino_tipo: 'edificio',
          destino_id: edificio.id_edificio,
          tiempo_estimado: 2,
          activo: true,
          detalles: {
            create: [
              { orden: 1, instruccion: 'Salida del edificio PIDET', latitud: latDest, longitud: lngDest },
              { orden: 2, instruccion: 'Llegada al punto de conexión', latitud: 20.656255, longitud: -100.404144 }
            ]
          }
        }
      });
      console.log(`Ruta creada exitosamente para PIDET -> ${edificio.nombre} (Ruta ID: ${nuevaRutaVuelta.id_ruta})`);
    } else {
      console.log(`La ruta para PIDET -> ${edificio.nombre} ya existe (Ruta ID: ${existeVuelta.id_ruta}).`);
    }
  }
}

seedPidetRoutes()
  .catch((e) => {
    console.error('Error en la ruta: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
