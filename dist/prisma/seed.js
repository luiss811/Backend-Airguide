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
            matricula: '1',
            correo: 'admin@uteq.edu.mx',
            password_hash: hashedPassword,
            nombre: 'Administrador del Sistema',
            rol: 'admin',
            prioridad: 2,
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
            prioridad: 4,
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
            prioridad: 4,
            estado: 'activo',
            fecha_validacion: new Date(),
        },
    });
    const usuarioProf1 = await prisma.usuario.create({
        data: {
            matricula: '2',
            correo: 'manuelcontreras@uteq.edu.mx',
            password_hash: hashedPassword,
            nombre: 'MANUEL CONTRERAS CASTILLO',
            rol: 'profesor',
            prioridad: 3,
            estado: 'activo',
            fecha_validacion: new Date(),
        },
    });
    const usuarioProf2 = await prisma.usuario.create({
        data: {
            matricula: '3',
            correo: 'titovilalobos@uteq.edu.mx',
            password_hash: hashedPassword,
            nombre: 'Mtro. Tito Vilalobos Cruz',
            rol: 'profesor',
            prioridad: 3,
            estado: 'activo',
            fecha_validacion: new Date(),
        },
    });
    const usuarioProf3 = await prisma.usuario.create({
        data: {
            matricula: '4',
            correo: 'ana.martinez@uteq.edu.mx',
            password_hash: hashedPassword,
            nombre: 'Mtra. Ana Martínez',
            rol: 'profesor',
            prioridad: 1,
            estado: 'activo',
            fecha_validacion: new Date(),
        },
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
            { nombre: 'CENTRO DE PRODUCTIVIDAD E INNOVACIÓN PARA LA INDUSTRIA 4.0 (CEPRODI 4.0)', descripcion: 'CENTRO DE PRODUCTIVIDAD E INNOVACIÓN PARA LA INDUSTRIA 4.0 (CEPRODI 4.0)', latitud: 20.657273933156947, longitud: -100.40344071181319, tipo: 'academico', activo: true },
            { nombre: 'Creativity and Innovation Center 4.0 CIC 4.0 UTEQ', descripcion: 'Creativity and Innovation Center 4.0 CIC 4.0 UTEQ', latitud: 20.657508309620276, longitud: -100.40353216395643, tipo: 'academico', activo: true },
            { nombre: 'Centro Cultural Comunitario Epigmenio González', descripcion: 'Centro Cultural Comunitario Epigmenio González', latitud: 20.658402946254615, longitud: -100.40520939370396, tipo: 'academico', activo: true },
            { nombre: 'Módulo Sanitario 2', descripcion: 'Módulo Sanitario 2', latitud: 20.656195217567845, longitud: -100.40419495024841, tipo: 'academico', activo: true },
            { nombre: 'Módulo Sanitario 1', descripcion: 'Módulo Sanitario 1', latitud: 20.65413223933458, longitud: -100.40412264297585, tipo: 'academico', activo: true },
            { nombre: 'Edificio de Idiomas', descripcion: 'División de lenguas extranjeras', latitud: 20.65506286044442, longitud: -100.40632227263758, tipo: 'academico', activo: true },
            { nombre: 'División Económica-Administrativa', descripcion: 'División Económica-Administrativa', latitud: 20.65379828424716, longitud: -100.40517874350944, tipo: 'academico', activo: true },
            { nombre: 'Entrada principal UTEQ', descripcion: 'Entrada principal de la universidad', latitud: 20.653229129293855, longitud: -100.40402422166468, tipo: 'academico', activo: true },
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
    const prof1 = await prisma.profesor.create({
        data: {
            id_usuario: usuarioProf1.id_usuario,
            departamento: 'Area de Desarrollo y Gestion de Software',
            activo: true,
        },
    });
    const prof2 = await prisma.profesor.create({
        data: {
            id_usuario: usuarioProf2.id_usuario,
            departamento: 'Matemáticas',
            activo: true,
        },
    });
    const prof3 = await prisma.profesor.create({
        data: {
            id_usuario: usuarioProf3.id_usuario,
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
                id_creador: admin.id_usuario,
                prioridad_evento: admin.prioridad,
                publico: true,
                activo: true,
            },
            {
                nombre: 'Conferencia de IA',
                descripcion: 'Charla magistral sobre Inteligencia Artificial',
                fecha_inicio: new Date('2026-03-20T14:00:00'),
                fecha_fin: new Date('2026-03-20T16:00:00'),
                id_edificio: industrial.id_edificio,
                id_creador: usuarioProf1.id_usuario,
                prioridad_evento: usuarioProf1.prioridad,
                publico: true,
                activo: true,
            },
            {
                nombre: 'Torneo Deportivo',
                descripcion: 'Competencia deportiva',
                fecha_inicio: new Date('2026-03-25T08:00:00'),
                fecha_fin: new Date('2026-03-25T18:00:00'),
                id_edificio: industrial.id_edificio,
                id_creador: alumno1.id_usuario,
                prioridad_evento: alumno1.prioridad,
                publico: true,
                activo: true,
            },
            {
                nombre: 'Semana Cultural',
                descripcion: 'Festival cultural con presentaciones artísticas',
                fecha_inicio: new Date('2026-04-01T10:00:00'),
                fecha_fin: new Date('2026-04-05T20:00:00'),
                id_edificio: auditorio.id_edificio,
                id_creador: admin.id_usuario,
                prioridad_evento: admin.prioridad,
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
                latitud: 20.654861,
                longitud: -100.403784,
            },
            {
                id_ruta: ruta1.id_ruta,
                orden: 2,
                instruccion: 'Girar a la izquierda y caminar por el paseo central',
                latitud: 20.654700,
                longitud: -100.403900,
            },
            {
                id_ruta: ruta1.id_ruta,
                orden: 3,
                instruccion: 'Continuar recto hasta el cruce',
                latitud: 20.654200,
                longitud: -100.404000,
            },
            {
                id_ruta: ruta1.id_ruta,
                orden: 4,
                instruccion: 'Girar a la derecha hacia el Laboratorio de mantenimiento industrial',
                latitud: 20.653950,
                longitud: -100.404100,
            },
            {
                id_ruta: ruta1.id_ruta,
                orden: 5,
                instruccion: 'Entrar al Laboratorio por la entrada principal',
                latitud: 20.653885,
                longitud: -100.404127,
            },
        ],
    });
    await prisma.rutaDetalle.createMany({
        data: [
            {
                id_ruta: ruta2.id_ruta,
                orden: 1,
                instruccion: 'Salir del Laboratorio de mantenimiento industrial',
                latitud: 20.653885,
                longitud: -100.404127,
            },
            {
                id_ruta: ruta2.id_ruta,
                orden: 2,
                instruccion: 'Caminar hacia el norte por el paseo peatonal',
                latitud: 20.654500,
                longitud: -100.405000,
            },
            {
                id_ruta: ruta2.id_ruta,
                orden: 3,
                instruccion: 'Continuar hasta ver el Auditorio de la UTEQ',
                latitud: 20.655500,
                longitud: -100.405500,
            },
            {
                id_ruta: ruta2.id_ruta,
                orden: 4,
                instruccion: 'Llegar al Auditorio Principal',
                latitud: 20.655928,
                longitud: -100.405901,
            },
        ],
    });
    await prisma.rutaDetalle.createMany({
        data: [
            {
                id_ruta: ruta3.id_ruta,
                orden: 1,
                instruccion: 'Salir de la Biblioteca Central',
                latitud: 20.654861,
                longitud: -100.403784,
            },
            {
                id_ruta: ruta3.id_ruta,
                orden: 2,
                instruccion: 'Girar a la derecha y caminar por el jardín central',
                latitud: 20.655000,
                longitud: -100.404500,
            },
            {
                id_ruta: ruta3.id_ruta,
                orden: 3,
                instruccion: 'Continuar por el camino principal',
                latitud: 20.655400,
                longitud: -100.405200,
            },
            {
                id_ruta: ruta3.id_ruta,
                orden: 4,
                instruccion: 'Seguir las señalizaciones hacia el Auditorio',
                latitud: 20.655700,
                longitud: -100.405600,
            },
            {
                id_ruta: ruta3.id_ruta,
                orden: 5,
                instruccion: 'Llegar al Auditorio Principal',
                latitud: 20.655928,
                longitud: -100.405901,
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
//# sourceMappingURL=seed.js.map