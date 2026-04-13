/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNewBuildingsRoutes() {
  const targetBuildings = await prisma.edificio.findMany({
    where: {
      OR: [
        { nombre: { contains: 'CIC' } },
        { nombre: { contains: 'CEPRODI' } },
        { nombre: { contains: 'PIDET' } }
      ]
    }
  });

  if (targetBuildings.length === 0) {
    throw new Error('No se encontraron los edificios CIC 4.0 y CEPRODI 4.0');
  }

  const otrosEdificios = await prisma.edificio.findMany({
    where: {
      id_edificio: {
        notIn: targetBuildings.map(e => e.id_edificio)
      }
    }
  });

  for (const target of targetBuildings) {
      await prisma.ruta.deleteMany({
        where: {
          OR: [
            { destino_id: target.id_edificio },
            { origen_id: target.id_edificio }
          ],
          destino_tipo: 'edificio',
          origen_tipo: 'edificio',
          id_ruta: { gt: 4 } // Evitar borrar rutas base si las hubiera
        }
      });
  }

  for (const targetEntry of targetBuildings) {
    const latDest = Number(targetEntry.latitud);
    const lngDest = Number(targetEntry.longitud);

    for (const edificio of otrosEdificios) {
        const latOri = Number(edificio.latitud);
        const lngOri = Number(edificio.longitud);

        // Ruta: Edificio -> NuevoEdificio
        const existeIda = await prisma.ruta.findFirst({
        where: {
            origen_tipo: 'edificio',
            origen_id: edificio.id_edificio,
            destino_tipo: 'edificio',
            destino_id: targetEntry.id_edificio,
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
            destino_id: targetEntry.id_edificio,
            tiempo_estimado: 2,
            activo: true,
            detalles: {
                create: [
                { orden: 1, instruccion: 'Llegada al punto de conexión', latitud: 20.656255, longitud: -100.404144 },
                { orden: 2, instruccion: `Llegada al edificio ${targetEntry.nombre}`, latitud: latDest, longitud: lngDest }
                ]
            }
            }
        });
        console.log(`Ruta creada ${edificio.nombre} -> ${targetEntry.nombre} (Ruta ID: ${nuevaRutaIda.id_ruta})`);
        } else {
        console.log(`La ruta ${edificio.nombre} -> ${targetEntry.nombre} ya existe (Ruta ID: ${existeIda.id_ruta}).`);
        }

        // Ruta: NuevoEdificio -> Edificio
        const existeVuelta = await prisma.ruta.findFirst({
        where: {
            origen_tipo: 'edificio',
            origen_id: targetEntry.id_edificio,
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
            origen_id: targetEntry.id_edificio,
            destino_tipo: 'edificio',
            destino_id: edificio.id_edificio,
            tiempo_estimado: 2,
            activo: true,
            detalles: {
                create: [
                { orden: 1, instruccion: `Salida del edificio ${targetEntry.nombre}`, latitud: latDest, longitud: lngDest },
                { orden: 2, instruccion: 'Llegada al punto de conexión', latitud: 20.656255, longitud: -100.404144 }
                ]
            }
            }
        });
        console.log(`Ruta creada ${targetEntry.nombre} -> ${edificio.nombre} (Ruta ID: ${nuevaRutaVuelta.id_ruta})`);
        } else {
        console.log(`La ruta ${targetEntry.nombre} -> ${edificio.nombre} ya existe (Ruta ID: ${existeVuelta.id_ruta}).`);
        }
    }
  }

  // Crear rutas directas cruzadas entre CIC, CEPRODI y PIDET
  for (let i = 0; i < targetBuildings.length; i++) {
    for (let j = i + 1; j < targetBuildings.length; j++) {
      const b1 = targetBuildings[i];
      const b2 = targetBuildings[j];

      const lat1 = Number(b1.latitud);
      const lng1 = Number(b1.longitud);
      const lat2 = Number(b2.latitud);
      const lng2 = Number(b2.longitud);

      // Ruta: b1 -> b2
      const existeIda = await prisma.ruta.findFirst({
        where: { origen_id: b1.id_edificio, destino_id: b2.id_edificio, tipo: 'interna' }
      });
      if (!existeIda) {
        await prisma.ruta.create({
          data: {
            tipo: 'interna',
            origen_tipo: 'edificio',
            origen_id: b1.id_edificio,
            destino_tipo: 'edificio',
            destino_id: b2.id_edificio,
            tiempo_estimado: 1,
            activo: true,
            detalles: {
              create: [
                { orden: 1, instruccion: `Salida del edificio ${b1.nombre}`, latitud: lat1, longitud: lng1 },
                { orden: 2, instruccion: `Llegada al edificio ${b2.nombre}`, latitud: lat2, longitud: lng2 }
              ]
            }
          }
        });
        console.log(`Ruta creada ${b1.nombre} -> ${b2.nombre}`);
      }

      // Ruta: b2 -> b1
      const existeVuelta = await prisma.ruta.findFirst({
        where: { origen_id: b2.id_edificio, destino_id: b1.id_edificio, tipo: 'interna' }
      });
      if (!existeVuelta) {
        await prisma.ruta.create({
          data: {
            tipo: 'interna',
            origen_tipo: 'edificio',
            origen_id: b2.id_edificio,
            destino_tipo: 'edificio',
            destino_id: b1.id_edificio,
            tiempo_estimado: 1,
            activo: true,
            detalles: {
              create: [
                { orden: 1, instruccion: `Salida del edificio ${b2.nombre}`, latitud: lat2, longitud: lng2 },
                { orden: 2, instruccion: `Llegada al edificio ${b1.nombre}`, latitud: lat1, longitud: lng1 }
              ]
            }
          }
        });
        console.log(`Ruta creada ${b2.nombre} -> ${b1.nombre}`);
      }
    }
  }
}

seedNewBuildingsRoutes()
  .catch((e) => {
    console.error('Error en la ruta: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
