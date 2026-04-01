import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("== Creando ruta manual de ejemplo: Cafeteria -> Auditorio ==");

  const cafeteria = await prisma.edificio.findFirst({
    where: { nombre: { contains: 'cafeteria', mode: 'insensitive' } }
  });

  const auditorio = await prisma.edificio.findFirst({
    where: { nombre: { contains: 'auditorio', mode: 'insensitive' } }
  });

  if (!cafeteria || !auditorio) {
    console.error("No se encontró la cafetería o el auditorio en la BD.");
    process.exit(1);
  }

  // Verificar si ya existe
  const existente = await prisma.ruta.findFirst({
    where: {
      origen_tipo: 'edificio',
      origen_id: cafeteria.id_edificio,
      destino_tipo: 'edificio',
      destino_id: auditorio.id_edificio,
    }
  });

  if (existente) {
    console.log("Ya existe una ruta manual entre estos puntos:", existente.id_ruta);
    process.exit(0);
  }

  // Generamos un par de puntos intermedios entre lat/lng de Cafeteria y Auditorio 
  // que "Vayan un tramo hacia arriba" como pidió el usuario.
  const latOri = Number(cafeteria.latitud);
  const lngOri = Number(cafeteria.longitud);

  const latDest = Number(auditorio.latitud);
  const lngDest = Number(auditorio.longitud);

  // Un punto intermedio desplazado hacia "arriba" (al norte, es decir, mas latitud)
  const midLat = (latOri + latDest) / 2 + 0.0003; // ligeramente al norte
  const midLng = (lngOri + lngDest) / 2;

  const nuevaRuta = await prisma.ruta.create({
    data: {
      tipo: 'interna',
      origen_tipo: 'edificio',
      origen_id: cafeteria.id_edificio,
      destino_tipo: 'edificio',
      destino_id: auditorio.id_edificio,
      tiempo_estimado: 2,
      activo: true,
      detalles: {
        create: [
          { orden: 1, instruccion: 'Saliendo de cafetería', latitud: latOri, longitud: lngOri },
          { orden: 2, instruccion: 'Tramo hacia arriba', latitud: midLat, longitud: midLng },
          { orden: 3, instruccion: 'Llegada al auditorio', latitud: latDest, longitud: lngDest }
        ]
      }
    }
  });

  console.log(`Ruta creada exitosamente con ID: ${nuevaRuta.id_ruta}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
