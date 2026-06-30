import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function main() {
  await prisma.caminoGeografico.deleteMany();
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

  await prisma.usuario.createMany({
    data: [
      { id_usuario: 1, correo: 'admin@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-11T01:24:37.808Z'), fecha_validacion: new Date('2026-04-13T04:18:09.150Z'), matricula: '1', nombre: 'Administrador del sistema', password_hash: '$2a$10$Ak3ImR4gvGN266XkmdHKiOttsdcLSC4H4tn0i1BhUuL2hYInpa7Ee', prioridad: 2, rol: 'admin' },
      { id_usuario: 2, correo: '2023171011@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-11T01:24:37.962Z'), fecha_validacion: new Date('2026-04-15T20:19:14.959Z'), matricula: '2023171011', nombre: 'Juan Pérez García', password_hash: '$2a$10$Ak3ImR4gvGN266XkmdHKiOttsdcLSC4H4tn0i1BhUuL2hYInpa7Ee', prioridad: 4, rol: 'alumno' },
      { id_usuario: 3, correo: '2019881719@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-11T01:24:38.037Z'), fecha_validacion: new Date('2026-04-15T20:34:20.091Z'), matricula: '2019881719', nombre: 'María López Hernández', password_hash: '$2a$10$Ak3ImR4gvGN266XkmdHKiOttsdcLSC4H4tn0i1BhUuL2hYInpa7Ee', prioridad: 4, rol: 'alumno' },
      { id_usuario: 4, correo: 'admin2@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-11T01:24:38.190Z'), fecha_validacion: new Date('2026-04-11T01:24:38.188Z'), matricula: '3', nombre: 'Administrador 2', password_hash: '$2a$10$Ak3ImR4gvGN266XkmdHKiOttsdcLSC4H4tn0i1BhUuL2hYInpa7Ee', prioridad: 2, rol: 'admin' },
      { id_usuario: 5, correo: 'profesorprueba@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-11T01:24:38.265Z'), fecha_validacion: new Date('2026-04-15T20:35:06.309Z'), matricula: '4', nombre: 'Profesor para desarrollo', password_hash: '$2a$10$Ak3ImR4gvGN266XkmdHKiOttsdcLSC4H4tn0i1BhUuL2hYInpa7Ee', prioridad: 3, rol: 'profesor' },
      { id_usuario: 6, correo: 'lalitorios81@gmail.com', estado: 'activo', fecha_registro: new Date('2026-04-11T23:31:34.513Z'), fecha_validacion: null, matricula: '202317', nombre: 'Luis Eduardo Rios Cervantes', password_hash: '$2a$10$NP8Tf5f.IC63g1IAr0.36.gOBXxeRzfUIgOdTSAhNO4WBqrrcJ0cC', prioridad: 2, rol: 'admin' },
      { id_usuario: 7, correo: 'angelica.garduno@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-14T16:06:34.394Z'), fecha_validacion: new Date('2026-04-15T20:34:59.019Z'), matricula: '2336151', nombre: 'Angelica', password_hash: '$2a$10$DxaCKRarMNOzJp2/81jiIefLKlAHJ39yxKUUIv/WK.UIeTJMUy4jC', prioridad: 4, rol: 'alumno' },
      { id_usuario: 8, correo: '20223371155@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-15T23:03:21.060Z'), fecha_validacion: new Date('2026-04-16T00:08:39.911Z'), matricula: '2023371155', nombre: 'Saul Perez', password_hash: '$2a$10$/Ej//ga9yFFNgnEpcDkHz.92/2rI3ta04DJQU0GAfyiR7PHso6t2e', prioridad: 4, rol: 'alumno' },
      { id_usuario: 9, correo: 'jorge.garcia.saldana@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172101', nombre: 'Jorge García Saldaña', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 10, correo: 'rogelio.bautista.sanchez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172102', nombre: 'Rogelio Bautista Sánchez', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 11, correo: 'raul.garcia.perez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172103', nombre: 'Raúl García Pérez', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 12, correo: 'filiberto.ruiz.hernandez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172104', nombre: 'Filiberto Ruiz Hernández', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 13, correo: 'jose.alberto.delgadillo.gutierrez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172105', nombre: 'José Alberto Delgadillo Gutiérrez', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 14, correo: 'emmanuel.martinez.hernandez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172106', nombre: 'Martinez Hernandez Emmanuel', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 15, correo: 'angelica.garduno.bustamante@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172107', nombre: 'Angelica Garduño Bustamante', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 16, correo: 'jesus.hernan.vazquez.perez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172108', nombre: 'Jesus Hernan Vazquez Pérez', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 17, correo: 'maria.rodriguez.vazquez@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172109', nombre: 'María Rodriguez Vazquez', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 18, correo: 'andrea.hernandez.mendoza@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172100', nombre: 'Andrea Hernandez Mendoza', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 19, correo: 'ma.aurora.osornio@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172110', nombre: 'Ma. Aurora Osornio', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 20, correo: 'manuel.contreras.castillo@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172111', nombre: 'Manuel Contreras Castillo', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 21, correo: 'tito.villalobos.cruz@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172112', nombre: 'Tito Villalobos Cruz', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 22, correo: 'brandon.efren.venegas.olvera@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172113', nombre: 'Brandon Efren Venegas Olvera', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 23, correo: 'ernesto.chaavero.navarrete@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172114', nombre: 'Ernesto Chavero Navarrete', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' },
      { id_usuario: 24, correo: 'gerardo.ramirez.villareal@uteq.edu.mx', estado: 'activo', fecha_registro: new Date('2026-04-16T00:05:54.236Z'), fecha_validacion: null, matricula: '2026172115', nombre: 'Gerardo Ramirez Villareal', password_hash: '$2b$10$R9h/lIPz0bouIz6IC9TbZ.0zQZkt7v5N.nSAnSZnSZnSZnSZnSZnS', prioridad: 3, rol: 'profesor' }
    ],
  });

  await prisma.profesor.createMany({
    data: [
      { id_profesor: 1, activo: true, departamento: 'Matemáticas', id_usuario: 4 },
      { id_profesor: 2, activo: true, departamento: 'Biblioteca', id_usuario: 5 },
      { id_profesor: 3, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 9 },
      { id_profesor: 4, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 10 },
      { id_profesor: 5, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 11 },
      { id_profesor: 6, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 12 },
      { id_profesor: 7, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 13 },
      { id_profesor: 8, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 14 },
      { id_profesor: 9, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 15 },
      { id_profesor: 10, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 16 },
      { id_profesor: 11, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 17 },
      { id_profesor: 12, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 18 },
      { id_profesor: 13, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 19 },
      { id_profesor: 14, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 20 },
      { id_profesor: 15, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 21 },
      { id_profesor: 16, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 22 },
      { id_profesor: 17, activo: true, departamento: 'Tecnologías de la Información', id_usuario: 23 }
    ],
  });



  const biblioteca = await prisma.edificio.create({
    data: {
      nombre: 'Biblioteca',
      descripcion: 'Edificio de biblioteca con salas de lectura y recursos digitales',
      latitud: 20.654851585160063, 
      longitud: -100.40377944333189,
      tipo: 'academico',
      activo: true,
    },
  });

  const industrial = await prisma.edificio.create({
    data: {
      nombre: 'División Industrial',
      descripcion: 'Complejo para mantenimiento industrial',
      latitud: 20.654485149504517, 
      longitud: -100.4041238595843,
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
      latitud: 20.65434973109689, 
      longitud: -100.4054322091192,
      tipo: 'administrativo',
      activo: true,
    },
  });

  const edificiok = await prisma.edificio.create({
    data: {
      nombre: 'División de Tecnologías de Automatización e Información',
      descripcion: 'Edificio K',
      latitud: 20.654291618223784, 
      longitud: -100.40461658955171,
      tipo: 'academico',
      activo: true,
    },
  });

  await prisma.edificio.createMany({
    data: [
      { nombre: 'Laboratorio de sistemas informáticos', descripcion: 'Laboratorios de Informatica', latitud: 20.654930554149125, longitud: -100.404422465654, tipo: 'academico', activo: true },
      { nombre: 'Enfermeria', descripcion: 'Consultorio médico y atención para enfermería', latitud: 20.65520357836995, longitud: -100.40516944805722, tipo: 'administrativo', activo: true },
      { nombre: 'Division de Tecnología Ambiental', descripcion: 'Edificio para la carrera de Tecnología Ambiental', latitud: 20.655315113193538, longitud: -100.40460289529847, tipo: 'academico', activo: true },
      { nombre: 'Edificio de Nanotecnologia', descripcion: 'Divición de Nanotecnología', latitud: 20.65585599228493, longitud: -100.40489268019967, tipo: 'academico', activo: true },
      { nombre: 'Cafetería UTEQ', descripcion: 'Cafetería de la universidad', latitud: 20.65484000, longitud: -100.4051103, tipo: 'recreativo', activo: true },
      { nombre: 'Edificio DEA G', descripcion: 'División de Administración', latitud: 20.655744444499224, longitud: -100.40389107030805, tipo: 'academico', activo: true },
      { nombre: 'Laboratorios de Procesos Industriales', descripcion: 'Laboratorios para la carrera de Procesos Industriales', latitud: 20.65395806078885, longitud: -100.40452534327541, tipo: 'academico', activo: true },
      { nombre: 'Almacén general y taller de mantenimiento', descripcion: 'Almacenamiento de equipos y recursos de la universidad', latitud: 20.6560779608174, longitud: -100.4038603087957, tipo: 'administrativo', activo: true },
      { nombre: 'Stellantis', descripcion: 'Laboratorio automotriz en colaboración con Stellantis', latitud: 20.656451833319984, longitud: -100.40353316929821, tipo: 'academico', activo: true },
      { nombre: 'Edificio PIDET', descripcion: 'Posgrado, Innovación, Desarrollo y Emprendimiento Tecnológico', latitud: 20.657866777273693, longitud: -100.40349625171959, tipo: 'academico', activo: true },
      { nombre: 'Vinculación escolar', descripcion: 'Oficinas para gestión de prácticas y vinculación', latitud: 20.65407190299459, longitud: -100.40609708035053, tipo: 'administrativo', activo: true },
      { nombre: 'Actividades Culturales', descripcion: 'Espacios para el desarrollo de actividades culturales', latitud: 20.65462502116124, longitud: -100.40621997125771, tipo: 'recreativo', activo: true },
      { nombre: 'Salón de canto', descripcion: 'Aula acondicionada para prácticas de canto', latitud: 20.654541127457858, longitud: -100.40627892345287, tipo: 'recreativo', activo: true },
      { nombre: 'Laboratorios de mecatrónica y TIC’s', descripcion: 'Edificio J', latitud: 20.65521884788733, longitud: -100.4054661571175, tipo: 'academico', activo: true },
      { nombre: 'CENTRO DE PRODUCTIVIDAD E INNOVACIÓN PARA LA INDUSTRIA  (CEPRODI )', descripcion: 'CENTRO DE PRODUCTIVIDAD E INNOVACIÓN PARA LA INDUSTRIA  (CEPRODI )', latitud: 20.657273933156947, longitud: -100.40344071181319, tipo: 'academico', activo: true },
      { nombre: 'Creativity and Innovation Center  CIC  UTEQ', descripcion: 'Creativity and Innovation Center  CIC  UTEQ', latitud: 20.657508309620276, longitud: -100.40353216395643, tipo: 'academico', activo: true },
      { nombre: 'Centro Cultural Comunitario Epigmenio González', descripcion: 'Centro Cultural Comunitario Epigmenio González', latitud: 20.658402946254615, longitud: -100.40520939370396, tipo: 'academico', activo: true },
      { nombre: 'Módulo Sanitario 2', descripcion: 'Módulo Sanitario 2', latitud: 20.656195217567845, longitud: -100.40419495024841, tipo: 'academico', activo: true },
      { nombre: 'Módulo Sanitario 1', descripcion: 'Módulo Sanitario 1', latitud: 20.65413223933458, longitud: -100.40412264297585, tipo: 'academico', activo: true },
      { nombre: 'Edificio de Idiomas', descripcion: 'División de lenguas extranjeras', latitud: 20.65506286044442, longitud: -100.40632227263758, tipo: 'academico', activo: true },
      { nombre: 'División Económica-Administrativa', descripcion: 'División Económica-Administrativa', latitud: 20.65379828424716, longitud: -100.40517874350944, tipo: 'academico', activo: true },
      { nombre: 'Entrada principal UTEQ', descripcion: 'Entrada principal de la universidad', latitud: 20.653229129293855, longitud: -100.40402422166468, tipo: 'academico', activo: true },
      { nombre: 'Entrada Lateral', descripcion: 'Entrada lateralde la universidad', latitud: 20.653621, longitud: -100.403655, tipo: 'academico', activo: false },
      { nombre: 'Entrada Cursos UTEQ', descripcion: 'Entrada para cursos de la UTEQ', latitud: 20.656271, longitud: -100.403197, tipo: 'academico', activo: true },
      { nombre: 'Entrada 6 acceso al Auditorio', descripcion: 'Acceso 6 - Auditorio UTEQ', latitud: 20.655452, longitud: -100.406990, tipo: 'academico', activo: true },
      { nombre: 'Entrada al estacionamiento', descripcion: 'Acceso al estacionamiento', latitud: 20.653522, longitud: -100.406109, tipo: 'academico', activo: true },
      { nombre: 'Entrada al estacionamiento', descripcion: 'Acceso al estacionamiento', latitud: 20.653331, longitud: -100.404968, tipo: 'academico', activo: true },
      { nombre: 'Entrada al estacionamiento', descripcion: 'Acceso al estacionamiento', latitud: 20.653678, longitud: -100.407221, tipo: 'academico', activo: true },
    ],
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

  await prisma.cubiculo.createMany({
    data: [
      { id_cubiculo: 1, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 2, numero: '201', piso: 1, referencia: 'Junto a la sala de lectura' },
      { id_cubiculo: 2, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 1, numero: '5', piso: 2, referencia: 'Subiendo las escaleras, entras por las puestas de cristal y a mano derecha, es el quinto cubiculo' },
      { id_cubiculo: 3, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 3, numero: 'AULA 12', piso: 2, referencia: 'Planta Alta' },
      { id_cubiculo: 4, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 4, numero: 'CISCO A12', piso: 1, referencia: 'Edificio J' },
      { id_cubiculo: 5, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 5, numero: 'CISCO CIC', piso: 1, referencia: 'Centro de Cómputo' },
      { id_cubiculo: 6, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 6, numero: 'DATAREA 11', piso: 2, referencia: 'Área de Datos' },
      { id_cubiculo: 7, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 7, numero: 'AREA 12', piso: 2, referencia: 'Área de Desarrollo' },
      { id_cubiculo: 8, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 8, numero: 'AREA 11', piso: 2, referencia: 'Planta Alta' },
      { id_cubiculo: 9, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 9, numero: 'SUMPA', piso: 1, referencia: 'Planta Baja' },
      { id_cubiculo: 10, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 10, numero: 'AULA 11', piso: 2, referencia: 'Planta Alta' },
      { id_cubiculo: 11, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 11, numero: 'AULA 17', piso: 2, referencia: 'Planta Alta' },
      { id_cubiculo: 12, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 12, numero: 'AULA 13', piso: 2, referencia: 'Planta Alta' },
      { id_cubiculo: 13, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 13, numero: 'EDIFICIO H', piso: 1, referencia: 'Área de Comunicación' },
      { id_cubiculo: 14, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 14, numero: 'AREA 11-I', piso: 2, referencia: 'Edificio I' },
      { id_cubiculo: 15, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 15, numero: 'AULA 16', piso: 2, referencia: 'Planta Alta' },
      { id_cubiculo: 16, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 16, numero: 'LADI 2', piso: 1, referencia: 'Laboratorio LADI' },
      { id_cubiculo: 17, activo: true, id_edificio: edificiok.id_edificio, id_profesor: 17, numero: 'AREA 8', piso: 1, referencia: 'Planta Baja' }
    ],
    skipDuplicates: true,
  });

  await prisma.evento.createMany({
    data: [
      {nombre: 'Feria Universitaria de Ciencias', descripcion: 'Exposición anual de proyectos científicos y tecnológicos', fecha_inicio: new Date('2026-03-15T09:00:00'), fecha_fin: new Date('2026-03-15T18:00:00'), id_edificio: auditorio.id_edificio, id_creador: 1, prioridad_evento: 4, publico: true, activo: true},
      {nombre: 'Conferencia de IA', descripcion: 'Charla magistral sobre Inteligencia Artificial', fecha_inicio: new Date('2026-03-20T14:00:00'), fecha_fin: new Date('2026-03-20T16:00:00'), id_edificio: industrial.id_edificio, id_creador: 11, prioridad_evento: 3, publico: true, activo: true},
      {nombre: 'Torneo Deportivo', descripcion: 'Competencia deportiva', fecha_inicio: new Date('2026-03-25T08:00:00'), fecha_fin: new Date('2026-03-25T18:00:00'), id_edificio: industrial.id_edificio, id_creador: 12, prioridad_evento: 3, publico: true,activo: true},
      {nombre: 'Semana Cultural', descripcion: 'Festival cultural con presentaciones artísticas', fecha_inicio: new Date('2026-04-01T10:00:00'), fecha_fin: new Date('2026-04-05T20:00:00'), id_edificio: auditorio.id_edificio, id_creador: 1, prioridad_evento: 2, publico: true, activo: true},
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
      {id_ruta: ruta1.id_ruta, orden: 1, instruccion: 'Salir de la Biblioteca Central por la puerta principal', latitud: 20.654861, longitud: -100.403784 },
      {id_ruta: ruta1.id_ruta, orden: 2, instruccion: 'Girar a la izquierda y caminar por el paseo central', latitud: 20.654700, longitud: -100.403900},
      {id_ruta: ruta1.id_ruta, orden: 3, instruccion: 'Continuar recto hasta el cruce', latitud: 20.654200, longitud: -100.404000 },
      {id_ruta: ruta1.id_ruta, orden: 4, instruccion: 'Girar a la derecha hacia el Laboratorio de mantenimiento industrial', latitud: 20.653950, longitud: -100.404100 },
      {id_ruta: ruta1.id_ruta, orden: 5, instruccion: 'Entrar al Laboratorio por la entrada principal', latitud: 20.653885, longitud: -100.404127 },
      {id_ruta: ruta2.id_ruta, orden: 1, instruccion: 'Salir del Laboratorio de mantenimiento industrial', latitud: 20.653885, longitud: -100.404127 },
      {id_ruta: ruta2.id_ruta, orden: 2, instruccion: 'Caminar hacia el norte por el paseo peatonal', latitud: 20.654500, longitud: -100.405000 },
      {id_ruta: ruta2.id_ruta, orden: 3, instruccion: 'Continuar hasta ver el Auditorio de la UTEQ', latitud: 20.655500, longitud: -100.405500 },
      {id_ruta: ruta2.id_ruta, orden: 4, instruccion: 'Llegar al Auditorio Principal', latitud: 20.655928, longitud: -100.405901 },
      {id_ruta: ruta3.id_ruta, orden: 1, instruccion: 'Salir de la Biblioteca Central', latitud: 20.654861, longitud: -100.403784},
      {id_ruta: ruta3.id_ruta, orden: 2, instruccion: 'Girar a la derecha y caminar por el jardín central', latitud: 20.655000, longitud: -100.404500 },
      {id_ruta: ruta3.id_ruta, orden: 3, instruccion: 'Continuar por el camino principal', latitud: 20.655400, longitud: -100.405200 },
      {id_ruta: ruta3.id_ruta, orden: 4, instruccion: 'Seguir las señalizaciones hacia el Auditorio', latitud: 20.655700, longitud: -100.405600 },
      {id_ruta: ruta3.id_ruta, orden: 5, instruccion: 'Llegar al Auditorio Principal', latitud: 20.655928, longitud: -100.405901 },
    ],
  });

  await prisma.logAcceso.createMany({
    data: [
      {
id_usuario: 1,
fecha: new Date('2026-03-01T08:30:00'),
ip: '192.168.1.100',
dispositivo: 'Mozilla/ (Windows NT ; Win64; x64)',
      },
      {
id_usuario: 2,
fecha: new Date('2026-03-01T09:15:00'),
ip: '192.168.1.101',
dispositivo: 'Mozilla/ (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
      },
      {
id_usuario: 3,
fecha: new Date('2026-03-01T10:00:00'),
ip: '192.168.1.102',
dispositivo: 'Mozilla/ (Linux; Android 11)',
      },
    ],
  });

  // Sembrar CaminoGeografico desde export.geojson
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const geojsonPath = path.resolve(__dirname, '../Data/export.geojson');

  if (fs.existsSync(geojsonPath)) {
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
    const matchingFeatures = geojsonData.features.filter((f: any) => 
      f.properties?.highway && ['footway', 'path', 'steps'].includes(f.properties.highway)
    );

    const caminosData = matchingFeatures.map((feature: any) => {
      const idStr = feature.id || feature.properties?.["@id"] || '';
      const match = idStr.match(/\d+/);
      const osm_id = match ? BigInt(match[0]) : BigInt(0);
      return {
        osm_id,
        tipo: feature.properties.highway,
        geometria: feature.geometry,
        activo: true
      };
    });

    await prisma.caminoGeografico.createMany({
      data: caminosData,
      skipDuplicates: true
    });
    console.log(`Se sembraron ${caminosData.length} caminos geográficos.`);
  } else {
    console.warn(`No se encontró el archivo GeoJSON en: ${geojsonPath}`);
  }
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

