import express from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireProfesor } from '../../middleware/auth.middleware.js';
import { createEventoSchema, updateEventoSchema } from '../../validators/evento.validator.js';
import { evaluarEvento } from '../../lib/eventoNeurona.js';
const app = express();
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for PDF base64 upload
// GET /me: Retrieve professor's personal data, profile, and cubicle info
app.get('/me', authenticate, requireProfesor, async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: userId },
            select: {
                id_usuario: true,
                nombre: true,
                correo: true,
                matricula: true,
                rol: true,
                estado: true,
                profesor_perfil: {
                    include: {
                        cubiculos: {
                            include: {
                                edificio: {
                                    select: {
                                        id_edificio: true,
                                        nombre: true,
                                        tipo: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(usuario);
    }
    catch (error) {
        console.error('Error in GET /me:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// PUT /me: Update professor's personal data, status, department, PDF schedule, and cubicle
app.put('/me', authenticate, requireProfesor, async (req, res) => {
    try {
        const userId = parseInt(req.user.userId);
        const { nombre, correo, matricula, activo, departamento, horario_pdf, cubiculo, } = req.body;
        // 1. Verify email uniqueness
        if (correo) {
            const emailConflict = await prisma.usuario.findFirst({
                where: {
                    correo,
                    id_usuario: { not: userId },
                },
            });
            if (emailConflict) {
                return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
            }
        }
        // 2. Verify matricula uniqueness
        if (matricula) {
            const matriculaConflict = await prisma.usuario.findFirst({
                where: {
                    matricula,
                    id_usuario: { not: userId },
                },
            });
            if (matriculaConflict) {
                return res.status(400).json({ error: 'La matrícula ya está registrada por otro usuario' });
            }
        }
        // 3. Update User Table
        await prisma.usuario.update({
            where: { id_usuario: userId },
            data: {
                nombre: nombre || undefined,
                correo: correo || undefined,
                matricula: matricula !== undefined ? matricula : undefined,
            },
        });
        // 4. Update or Create Profesor Profile
        let profesor = await prisma.profesor.findUnique({
            where: { id_usuario: userId },
        });
        if (!profesor) {
            profesor = await prisma.profesor.create({
                data: {
                    id_usuario: userId,
                    departamento: departamento || 'General',
                    activo: activo !== undefined ? activo : true,
                    horario_pdf: horario_pdf || null,
                },
            });
        }
        else {
            profesor = await prisma.profesor.update({
                where: { id_profesor: profesor.id_profesor },
                data: {
                    departamento: departamento !== undefined ? departamento : undefined,
                    activo: activo !== undefined ? activo : undefined,
                    horario_pdf: horario_pdf !== undefined ? horario_pdf : undefined,
                },
            });
        }
        // 5. Update or Create Cubicle
        if (cubiculo) {
            const edificioId = parseInt(cubiculo.id_edificio);
            const piso = parseInt(cubiculo.piso);
            const numero = cubiculo.numero;
            const referencia = cubiculo.referencia || null;
            if (!isNaN(edificioId) && numero) {
                const existingCubiculo = await prisma.cubiculo.findFirst({
                    where: { id_profesor: profesor.id_profesor },
                });
                if (existingCubiculo) {
                    await prisma.cubiculo.update({
                        where: { id_cubiculo: existingCubiculo.id_cubiculo },
                        data: {
                            id_edificio: edificioId,
                            piso: isNaN(piso) ? 1 : piso,
                            numero,
                            referencia,
                        },
                    });
                }
                else {
                    await prisma.cubiculo.create({
                        data: {
                            id_profesor: profesor.id_profesor,
                            id_edificio: edificioId,
                            piso: isNaN(piso) ? 1 : piso,
                            numero,
                            referencia,
                            activo: true,
                        },
                    });
                }
            }
        }
        // 6. Fetch fully updated profile
        const updatedProfile = await prisma.usuario.findUnique({
            where: { id_usuario: userId },
            select: {
                id_usuario: true,
                nombre: true,
                correo: true,
                matricula: true,
                rol: true,
                estado: true,
                profesor_perfil: {
                    include: {
                        cubiculos: {
                            include: {
                                edificio: {
                                    select: {
                                        id_edificio: true,
                                        nombre: true,
                                        tipo: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        return res.json(updatedProfile);
    }
    catch (error) {
        console.error('Error in PUT /me:', error);
        return res.status(500).json({ error: 'Error interno al actualizar datos del profesor' });
    }
});
// GET /eventos: Retrieve all events
app.get('/eventos', authenticate, requireProfesor, async (req, res) => {
    try {
        const eventos = await prisma.evento.findMany({
            include: {
                edificio: {
                    select: {
                        id_edificio: true,
                        nombre: true,
                        tipo: true,
                        latitud: true,
                        longitud: true,
                    },
                },
                creador: {
                    select: {
                        id_usuario: true,
                        nombre: true,
                        correo: true,
                    },
                },
            },
            orderBy: { fecha_inicio: 'asc' },
        });
        return res.json(eventos);
    }
    catch (error) {
        console.error('Error in GET /eventos:', error);
        return res.status(500).json({ error: 'Error al obtener eventos' });
    }
});
// POST /eventos: Create a new event with teacher restrictions and neuro evaluation
app.post('/eventos', authenticate, requireProfesor, async (req, res) => {
    try {
        const data = createEventoSchema.parse(req.body);
        const creadorId = parseInt(req.user.userId);
        // Forces teacher restrictions: fixed creator and priority = 3
        const prioritadVal = 3;
        // Evaluate collision with neural network (event neuron)
        const evaluacion = await evaluarEvento({
            ...data,
            id_creador: creadorId,
            prioridad_evento: prioritadVal,
        });
        if (!evaluacion.permitir) {
            return res.status(409).json({ error: evaluacion.mensaje });
        }
        const nuevoEvento = await prisma.evento.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : new Date(),
                fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : new Date(),
                id_edificio: data.id_edificio,
                publico: data.publico ?? true,
                activo: data.activo ?? true,
                id_creador: creadorId,
                prioridad_evento: prioritadVal,
                total_invitados: data.total_invitados ?? 0,
                es_de_paga: data.es_de_paga ?? false,
                precio: data.precio ?? null
            },
            include: { edificio: true },
        });
        const responsePayload = { ...nuevoEvento };
        if (evaluacion.tipo === 'DESPLAZAMIENTO_REALIZADO') {
            responsePayload.warning = 'El evento fue agendado desplazando otros debido a prioridades.';
        }
        return res.status(201).json(responsePayload);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error in POST /eventos:', error);
        return res.status(500).json({ error: 'Error al crear evento' });
    }
});
// PUT /eventos/:id: Update an event only if the professor is the creator
app.put('/eventos/:id(\\d+)', authenticate, requireProfesor, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateEventoSchema.parse(req.body);
        const creadorId = parseInt(req.user.userId);
        const existingEvento = await prisma.evento.findUnique({
            where: { id_evento: Number(id) },
        });
        if (!existingEvento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        // Restrict edit: Must be the creator
        if (existingEvento.id_creador !== creadorId) {
            return res.status(403).json({ error: 'Acceso denegado. No puedes editar eventos creados por otros profesores' });
        }
        const priorityVal = 3; // Fixed priority for professors
        // Re-evaluate with neural network if schedule or place changes
        if (data.fecha_inicio || data.fecha_fin || data.id_edificio) {
            const dummyEvento = {
                ...existingEvento,
                ...data,
                prioridad_evento: priorityVal,
            };
            const evaluacion = await evaluarEvento(dummyEvento);
            if (!evaluacion.permitir) {
                return res.status(409).json({ error: evaluacion.mensaje });
            }
        }
        const updatePayload = {
            ...data,
            fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : undefined,
            fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : undefined,
            prioridad_evento: priorityVal, // Force fixed priority
        };
        const updatedEvento = await prisma.evento.update({
            where: { id_evento: Number(id) },
            data: updatePayload,
            include: { edificio: true },
        });
        return res.json(updatedEvento);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Error in PUT /eventos/:id:', error);
        return res.status(500).json({ error: 'Error al actualizar evento' });
    }
});
// DELETE /eventos/:id: Delete an event only if the professor is the creator
app.delete('/eventos/:id(\\d+)', authenticate, requireProfesor, async (req, res) => {
    try {
        const { id } = req.params;
        const creadorId = parseInt(req.user.userId);
        const existingEvento = await prisma.evento.findUnique({
            where: { id_evento: Number(id) },
        });
        if (!existingEvento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        // Restrict delete: Must be the creator
        if (existingEvento.id_creador !== creadorId) {
            return res.status(403).json({ error: 'Acceso denegado. No puedes eliminar eventos creados por otros profesores' });
        }
        await prisma.evento.delete({
            where: { id_evento: Number(id) },
        });
        return res.json({ message: 'Evento eliminado correctamente' });
    }
    catch (error) {
        console.error('Error in DELETE /eventos/:id:', error);
        return res.status(500).json({ error: 'Error al eliminar evento' });
    }
});
const PORT = 3016;
app.listen(PORT, () => console.log('Servicio de profesores corriendo'));
//# sourceMappingURL=index.js.map