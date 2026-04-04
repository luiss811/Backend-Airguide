/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function pidet() {
  console.log("== Creando ruta manual de ejemplo: Auditorio -> PIDET ==");

  const auditorio = await prisma.edificio.findFirst({
    where: { nombre: { contains: 'Auditorio de la UTEQ', mode: 'insensitive' } }
  });

  const pidet = await prisma.edificio.findFirst({
    where: { nombre: { contains: 'PIDET', mode: 'insensitive' } }
  });

  if (!auditorio || !pidet) {
    throw new Error('No se encontraron los edificios requeridos');
  }

  // Generamos puntos intermedios para que la ruta vaya por dentro del campus (L-shape)
  const latOri = Number(auditorio.latitud);
  const lngOri = Number(auditorio.longitud);

  const latDest = Number(pidet.latitud);
  const lngDest = Number(pidet.longitud);

  // Punto intermedio 1: Moverse al este hacia el pasillo central de edificios
  const midLat1 = 20.655928;
  const midLng1 = -100.404200;

  // Punto intermedio 2: Moverse al norte por el pasillo
  const midLat2 = 20.656600;
  const midLng2 = -100.404000;

  const nuevaRuta = await prisma.ruta.create({
    data: {
      tipo: 'interna',
      origen_tipo: 'edificio',
      origen_id: auditorio.id_edificio,
      destino_tipo: 'edificio',
      destino_id: pidet.id_edificio,
      tiempo_estimado: 4,
      activo: true,
      detalles: {
        create: [
          { orden: 1, instruccion: 'Saliendo del auditorio', latitud: latOri, longitud: lngOri },
          { orden: 2, instruccion: 'Caminando hacia la zona este del campus', latitud: midLat1, longitud: midLng1 },
          { orden: 3, instruccion: 'Caminando hacia el norte pasando Stellantis', latitud: midLat2, longitud: midLng2 },
          { orden: 4, instruccion: 'Llegada al edificio PIDET', latitud: latDest, longitud: lngDest }
        ]
      }
    }
  });

  console.log(`Ruta creada exitosamente con ID: ${nuevaRuta.id_ruta}`);
}

pidet()
  .catch((e) => {
    console.error('Error en la ruta: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
