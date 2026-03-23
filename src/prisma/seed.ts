import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.logAcceso.deleteMany();
  await prisma.rutaDetalle.deleteMany();
  await prisma.ruta.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.cubiculo.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.profesor.deleteMany();
  await prisma.edificio.deleteMany();
  await prisma.usuario.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.usuario.create({
    data: {
      correo: 'admin@uteq.edu.mx',
      password_hash: hashedPassword,
      nombre: 'Administrador del Sistema',
      rol: 'admin',
      estado: 'activo',
      fecha_validacion: new Date(),
    },
  });

  const alumno1 = await prisma.usuario.create({
    data: {
      matricula: '2023171011',
      correo: '2023171011@uteq.edu.mx',
      password_hash: hashedPassword,
      nombre: 'Juan Pérez García',
      rol: 'alumno',
      estado: 'activo',
      fecha_validacion: new Date(),
    },
  });

  const alumno2 = await prisma.usuario.create({
    data: {
      matricula: '2019881719',
      correo: '2019881719@uteq.edu.mx',
      password_hash: hashedPassword,
      nombre: 'María López Hernández',
      rol: 'alumno',
      estado: 'activo',
      fecha_validacion: new Date(),
    },
  });

  const biblioteca = await prisma.edificio.create({
    data: {
      nombre: 'Biblioteca',
      descripcion: 'Edificio de biblioteca con salas de lectura y recursos digitales',
      latitud: 20.654861,
      longitud: -100.403784,
      tipo: 'academico',
      activo: true,
    },
  });

  const industrial = await prisma.edificio.create({
    data: {
      nombre: 'Laboratorio de mantenimiento industrial',
      descripcion: 'Complejo de laboratorios para mantenimiento industrial',
      latitud: 20.653885,
      longitud: -100.404127,
      tipo: 'academico',
      activo: true,
    },
  });

  const auditorio = await prisma.edificio.create({
    data: {
      nombre: 'Auditorio de la UTEQ',
      descripcion: 'Auditorio para actividades recreativas, graduaciones y eventos culturales',
      latitud: 20.655928,
      longitud: -100.405901,
      tipo: 'recreativo',
      activo: true,
    },
  });

  const Rectoria = await prisma.edificio.create({
    data: {
      nombre: 'Rectoria',
      descripcion: 'Oficinas administrativas',
      latitud: 20.654284776127646,
      longitud: -100.40564128442107,
      tipo: 'administrativo',
      activo: true,
    },
  });

  const edificiok = await prisma.edificio.create({
    data: {
      nombre: 'Edificio K',
      descripcion: 'División de Tecnologias, Automatización e Innovación',
      latitud: 20.654407,
      longitud: -100.40469,
      tipo: 'academico',
      activo: true,
    },
  });

  await prisma.salon.createMany({
    data: [
      { id_edificio: biblioteca.id_edificio, nombre: 'Sala de Computo', piso: 1, tipo: 'laboratorio', activo: false },
      { id_edificio: biblioteca.id_edificio, nombre: 'Sala de Lectura', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: biblioteca.id_edificio, nombre: 'Sala de Revistas', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: industrial.id_edificio, nombre: 'Laboratorio 101', piso: 1, tipo: 'laboratorio', activo: true },
      { id_edificio: industrial.id_edificio, nombre: 'Laboratorio 201', piso: 1, tipo: 'laboratorio', activo: true },
      { id_edificio: industrial.id_edificio, nombre: 'Lab. Física', piso: 1, tipo: 'laboratorio', activo: true },
      { id_edificio: industrial.id_edificio, nombre: 'Lab. Química', piso: 1, tipo: 'laboratorio', activo: true },
      { id_edificio: auditorio.id_edificio, nombre: 'Auditorio', piso: 1, tipo: 'auditorio', activo: true },
      { id_edificio: auditorio.id_edificio, nombre: 'Sala de Conferencias', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Biblioteca de pasillo', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 4', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 5', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 6', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 7', piso: 1, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 11 SUMPA', piso: 2, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 12', piso: 2, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 13', piso: 2, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 14', piso: 2, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 15', piso: 2, tipo: 'aula', activo: true },
      { id_edificio: edificiok.id_edificio, nombre: 'Aula 16', piso: 2, tipo: 'aula', activo: true },
      { id_edificio: Rectoria.id_edificio, nombre: 'Rectoria', piso: 1, tipo: 'aula', activo: true },
    ],
  });

  const prof1 = await prisma.profesor.create({
    data: {
      nombre: 'MANUEL CONTRERAS CASTILLO',
      correo: 'manuelcontreras@uteq.edu.mx',
      departamento: 'Area de Desarrollo y Gestion de Software',
      activo: true,
    },
  });

  const prof2 = await prisma.profesor.create({
    data: {
      nombre: 'Mtro. Tito Vilalobos Cruz',
      correo: 'titovilalobos@uteq.edu.mx',
      departamento: 'Matemáticas',
      activo: true,
    },
  });

  const prof3 = await prisma.profesor.create({
    data: {
      nombre: 'Mtra. Ana Martínez',
      correo: 'ana.martinez@uteq.edu.mx',
      departamento: 'Biblioteca',
      activo: true,
    },
  });

  await prisma.cubiculo.createMany({
    data: [
      {
        id_profesor: prof1.id_profesor,
        id_edificio: edificiok.id_edificio,
        numero: '301-A',
        piso: 2,
        referencia: 'Subiendo por las escaleras, a la derecha',
        activo: true,
      },
      {
        id_profesor: prof2.id_profesor,
        id_edificio: edificiok.id_edificio,
        numero: '302-B',
        piso: 2,
        referencia: 'Al final del pasillo, doblando a la derecha',
        activo: true,
      },
      {
        id_profesor: prof3.id_profesor,
        id_edificio: biblioteca.id_edificio,
        numero: '201',
        piso: 1,
        referencia: 'Junto a la sala de lectura',
        activo: true,
      },
    ],
  });

  await prisma.evento.createMany({
    data: [
      {
        nombre: 'Feria Universitaria de Ciencias',
        descripcion: 'Exposición anual de proyectos científicos y tecnológicos',
        fecha_inicio: new Date('2026-03-15T09:00:00'),
        fecha_fin: new Date('2026-03-15T18:00:00'),
        id_edificio: auditorio.id_edificio,
        publico: true,
        activo: true,
      },
      {
        nombre: 'Conferencia de IA',
        descripcion: 'Charla magistral sobre Inteligencia Artificial',
        fecha_inicio: new Date('2026-03-20T14:00:00'),
        fecha_fin: new Date('2026-03-20T16:00:00'),
        id_edificio: industrial.id_edificio,
        publico: true,
        activo: true,
      },
      {
        nombre: 'Torneo Deportivo',
        descripcion: 'Competencia deportiva',
        fecha_inicio: new Date('2026-03-25T08:00:00'),
        fecha_fin: new Date('2026-03-25T18:00:00'),
        id_edificio: industrial.id_edificio,
        publico: true,
        activo: true,
      },
      {
        nombre: 'Semana Cultural',
        descripcion: 'Festival cultural con presentaciones artísticas',
        fecha_inicio: new Date('2026-04-01T10:00:00'),
        fecha_fin: new Date('2026-04-05T20:00:00'),
        id_edificio: auditorio.id_edificio,
        publico: true,
        activo: true,
      },
    ],
  });

  const ruta1 = await prisma.ruta.create({
    data: {
      tipo: 'interna',
      origen_tipo: 'edificio',
      origen_id: biblioteca.id_edificio,
      destino_tipo: 'edificio',
      destino_id: industrial.id_edificio,
      tiempo_estimado: 5,
      activo: true,
    },
  });

  const ruta2 = await prisma.ruta.create({
    data: {
      tipo: 'interna',
      origen_tipo: 'edificio',
      origen_id: industrial.id_edificio,
      destino_tipo: 'edificio',
      destino_id: auditorio.id_edificio,
      tiempo_estimado: 8,
      activo: true,
    },
  });

  const ruta3 = await prisma.ruta.create({
    data: {
      tipo: 'interna',
      origen_tipo: 'edificio',
      origen_id: biblioteca.id_edificio,
      destino_tipo: 'edificio',
      destino_id: auditorio.id_edificio,
      tiempo_estimado: 10,
      activo: true,
    },
  });

  await prisma.rutaDetalle.createMany({
    data: [
      {
        id_ruta: ruta1.id_ruta,
        orden: 1,
        instruccion: 'Salir de la Biblioteca Central por la puerta principal',
        latitud: 4.63820000,
        longitud: -74.08360000,
      },
      {
        id_ruta: ruta1.id_ruta,
        orden: 2,
        instruccion: 'Girar a la izquierda y caminar por el paseo central',
        latitud: 4.63815000,
        longitud: -74.08350000,
      },
      {
        id_ruta: ruta1.id_ruta,
        orden: 3,
        instruccion: 'Continuar recto hasta el cruce',
        latitud: 4.63810000,
        longitud: -74.08340000,
      },
      {
        id_ruta: ruta1.id_ruta,
        orden: 4,
        instruccion: 'Girar a la derecha hacia el Edificio de Ingenierías',
        latitud: 4.63805000,
        longitud: -74.08330000,
      },
      {
        id_ruta: ruta1.id_ruta,
        orden: 5,
        instruccion: 'Entrar al Edificio de Ingenierías por la entrada principal',
        latitud: 4.63800000,
        longitud: -74.08300000,
      },
    ],
  });

  await prisma.rutaDetalle.createMany({
    data: [
      {
        id_ruta: ruta2.id_ruta,
        orden: 1,
        instruccion: 'Salir del Edificio de Ingenierías',
        latitud: 4.63800000,
        longitud: -74.08300000,
      },
      {
        id_ruta: ruta2.id_ruta,
        orden: 2,
        instruccion: 'Caminar hacia el sur por el paseo peatonal',
        latitud: 4.63780000,
        longitud: -74.08280000,
      },
      {
        id_ruta: ruta2.id_ruta,
        orden: 3,
        instruccion: 'Continuar hasta ver el Auditorio Principal',
        latitud: 4.63760000,
        longitud: -74.08260000,
      },
      {
        id_ruta: ruta2.id_ruta,
        orden: 4,
        instruccion: 'Llegar al Auditorio Principal',
        latitud: 4.63750000,
        longitud: -74.08250000,
      },
    ],
  });

  await prisma.rutaDetalle.createMany({
    data: [
      {
        id_ruta: ruta3.id_ruta,
        orden: 1,
        instruccion: 'Salir de la Biblioteca Central',
        latitud: 4.63820000,
        longitud: -74.08360000,
      },
      {
        id_ruta: ruta3.id_ruta,
        orden: 2,
        instruccion: 'Girar a la derecha y caminar por el jardín central',
        latitud: 4.63800000,
        longitud: -74.08330000,
      },
      {
        id_ruta: ruta3.id_ruta,
        orden: 3,
        instruccion: 'Continuar por el camino principal',
        latitud: 4.63780000,
        longitud: -74.08300000,
      },
      {
        id_ruta: ruta3.id_ruta,
        orden: 4,
        instruccion: 'Seguir las señalizaciones hacia el Auditorio',
        latitud: 4.63760000,
        longitud: -74.08270000,
      },
      {
        id_ruta: ruta3.id_ruta,
        orden: 5,
        instruccion: 'Llegar al Auditorio Principal',
        latitud: 4.63750000,
        longitud: -74.08250000,
      },
    ],
  });

  await prisma.logAcceso.createMany({
    data: [
      {
        id_usuario: admin.id_usuario,
        fecha: new Date('2026-03-01T08:30:00'),
        ip: '192.168.1.100',
        dispositivo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        id_usuario: alumno1.id_usuario,
        fecha: new Date('2026-03-01T09:15:00'),
        ip: '192.168.1.101',
        dispositivo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      },
      {
        id_usuario: alumno2.id_usuario,
        fecha: new Date('2026-03-01T10:00:00'),
        ip: '192.168.1.102',
        dispositivo: 'Mozilla/5.0 (Linux; Android 11)',
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
