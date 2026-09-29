import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import { generateToken, verifyToken } from './lib/jwt.js';
import { sendOtpEmail } from './lib/email.js';
import { generateOtp, getOtpExpiry } from './lib/otp.js';
import { loginSchema, registerSchema } from './validators/auth.validator.js';
import { createEdificioSchema, updateEdificioSchema } from './validators/edificio.validator.js';
import { createEventoSchema, updateEventoSchema } from './validators/evento.validator.js';
import { createRutaSchema, updateRutaSchema, createRutaDetalleSchema } from './validators/ruta.validator.js';
import { evaluarEvento } from './lib/eventoNeurona.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://airguide.vercel.app',
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'No autorizado' });
    }
};
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    next();
};
// HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Login — Step 1: validate credentials and send OTP
app.post('/api/auth/login', async (req, res) => {
    try {
        const { correo, password } = loginSchema.parse(req.body);
        const usuario = await prisma.usuario.findUnique({
            where: { correo },
        });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        if (usuario.estado !== 'activo') {
            return res.status(403).json({ error: 'Tu cuenta aún no ha sido validada. Por favor contacta al administrador.' });
        }
        const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        // Invalidate any previous OTPs for this user
        await prisma.codigoOtp.updateMany({
            where: { id_usuario: usuario.id_usuario, usado: false },
            data: { usado: false },
        });
        // Generate and store new OTP
        const codigo = generateOtp();
        const expira_en = getOtpExpiry();
        await prisma.codigoOtp.create({
            data: {
                id_usuario: usuario.id_usuario,
                codigo,
                expira_en,
            },
        });
        // Send OTP via email
        await sendOtpEmail(usuario.correo, usuario.nombre, codigo);
        return res.json({
            requiresTwoFactor: true,
            correo: usuario.correo,
            message: 'Código de verificación enviado a tu correo electrónico.',
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Login — Step 2: verify OTP and return JWT token
app.post('/api/auth/verify-2fa', async (req, res) => {
    try {
        const { correo, codigo } = req.body;
        if (!correo || !codigo) {
            return res.status(400).json({ error: 'Correo y código son requeridos' });
        }
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        const ahora = new Date();
        const otpRecord = await prisma.codigoOtp.findFirst({
            where: {
                id_usuario: usuario.id_usuario,
                codigo,
                usado: false,
                expira_en: { gt: ahora },
            },
            orderBy: { creado_en: 'desc' },
        });
        if (!otpRecord) {
            return res.status(401).json({ error: 'Código incorrecto o expirado. Solicita uno nuevo.' });
        }
        // Mark OTP as used
        await prisma.codigoOtp.update({
            where: { id: otpRecord.id },
            data: { usado: true },
        });
        // Generate JWT token
        const token = generateToken({
            userId: usuario.id_usuario.toString(),
            email: usuario.correo,
            role: usuario.rol,
        });
        // Log access
        const userAgent = req.headers['user-agent'] || 'Desconocido';
        const ip = req.ip || req.socket.remoteAddress || 'Desconocido';
        await prisma.logAcceso.create({
            data: {
                id_usuario: usuario.id_usuario,
                ip,
                dispositivo: userAgent,
            },
        });
        return res.json({
            token,
            usuario: {
                id: usuario.id_usuario,
                correo: usuario.correo,
                nombre: usuario.nombre,
                matricula: usuario.matricula,
                rol: usuario.rol,
                prioridad: usuario.prioridad,
                estado: usuario.estado,
            },
        });
    }
    catch (error) {
        console.error('Verify 2FA error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
    try {
        const { correo } = req.body;
        if (!correo) {
            return res.status(400).json({ error: 'Correo es requerido' });
        }
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario || usuario.estado !== 'activo') {
            // Return success to avoid email enumeration
            return res.json({ message: 'Si el correo existe, recibirás un nuevo código.' });
        }
        // Invalidate previous OTPs
        await prisma.codigoOtp.updateMany({
            where: { id_usuario: usuario.id_usuario, usado: false },
            data: { usado: true },
        });
        const codigo = generateOtp();
        const expira_en = getOtpExpiry();
        await prisma.codigoOtp.create({
            data: { id_usuario: usuario.id_usuario, codigo, expira_en },
        });
        await sendOtpEmail(usuario.correo, usuario.nombre, codigo);
        return res.json({ message: 'Nuevo código enviado a tu correo electrónico.' });
    }
    catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { correo, password, nombre, matricula } = registerSchema.parse(req.body);
        const existingUsuario = await prisma.usuario.findUnique({
            where: { correo },
        });
        if (existingUsuario) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        if (matricula) {
            const existingMatricula = await prisma.usuario.findUnique({
                where: { matricula },
            });
            if (existingMatricula) {
                return res.status(400).json({ error: 'La matrícula ya está registrada' });
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const usuario = await prisma.usuario.create({
            data: {
                correo,
                matricula: matricula ?? "",
                password_hash: hashedPassword,
                nombre,
                rol: 'alumno',
                estado: 'pendiente',
                prioridad: 4,
            },
        });
        return res.status(201).json({
            message: 'Registro exitoso. Tu cuenta está pendiente de validación por un administrador.',
            usuario: {
                id: usuario.id_usuario,
                correo: usuario.correo,
                nombre: usuario.nombre,
                matricula: usuario.matricula,
                rol: usuario.rol,
                estado: usuario.estado,
            },
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get usuario
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: parseInt(req.user.userId) },
            select: {
                id_usuario: true,
                correo: true,
                nombre: true,
                matricula: true,
                rol: true,
                estado: true,
                fecha_registro: true,
                fecha_validacion: true,
            },
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        return res.json(usuario);
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Validar usuario por parte del administrador
app.put('/api/auth/validate/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        if (!['activo', 'rechazado'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        const usuario = await prisma.usuario.update({
            where: { id_usuario: Number(id) },
            data: {
                estado,
                fecha_validacion: new Date(),
            },
        });
        return res.json(usuario);
    }
    catch (error) {
        console.error('Validate user error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get usuarios pendientes de validación
app.get('/api/auth/pending', authenticate, requireAdmin, async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            where: { estado: 'pendiente' },
            select: {
                id_usuario: true,
                correo: true,
                nombre: true,
                matricula: true,
                rol: true,
                estado: true,
                fecha_registro: true,
            },
            orderBy: { fecha_registro: 'desc' },
        });
        return res.json(usuarios);
    }
    catch (error) {
        console.error('Get usuarios pendientes error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get usuarios
app.get('/api/auth/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id_usuario: true,
                correo: true,
                nombre: true,
                matricula: true,
                rol: true,
                estado: true,
                fecha_registro: true,
                fecha_validacion: true,
            },
            orderBy: { fecha_registro: 'desc' },
        });
        return res.json(usuarios);
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get edificios
app.get('/api/edificios', async (req, res) => {
    try {
        const { tipo, activo } = req.query;
        const where = {};
        if (tipo)
            where.tipo = tipo;
        if (activo !== undefined)
            where.activo = activo === 'true';
        const edificios = await prisma.edificio.findMany({
            where,
            include: {
                _count: {
                    select: {
                        salones: true,
                        cubiculos: true,
                        eventos: true,
                    },
                },
            },
            orderBy: { nombre: 'asc' },
        });
        return res.json(edificios);
    }
    catch (error) {
        console.error('Get edificios error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get edificio id
app.get('/api/edificios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const edificio = await prisma.edificio.findUnique({
            where: { id_edificio: Number(id) },
            include: {
                salones: {
                    where: { activo: true },
                    orderBy: { piso: 'asc' },
                },
                cubiculos: {
                    where: { activo: true },
                    include: {
                        profesor: true,
                    },
                    orderBy: { piso: 'asc' },
                },
                eventos: {
                    where: {
                        activo: true,
                        fecha_inicio: { gte: new Date() },
                    },
                    orderBy: { fecha_inicio: 'asc' },
                },
            },
        });
        if (!edificio) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        return res.json(edificio);
    }
    catch (error) {
        console.error('Get edificio error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create edificio
app.post('/api/edificios', authenticate, requireAdmin, async (req, res) => {
    try {
        const data = createEdificioSchema.parse(req.body);
        const edificio = await prisma.edificio.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                latitud: data.latitud,
                longitud: data.longitud,
                tipo: data.tipo,
                activo: data.activo ?? true,
            },
        });
        return res.status(201).json(edificio);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Create edificio error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Update edificio
app.put('/api/edificios/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateEdificioSchema.parse(req.body);
        const existingEdificio = await prisma.edificio.findUnique({
            where: { id_edificio: Number(id) },
        });
        if (!existingEdificio) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        const edificio = await prisma.edificio.update({
            where: { id_edificio: Number(id) },
            data,
        });
        return res.json(edificio);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Update edificio error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Delete edificio
app.delete('/api/edificios/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existingEdificio = await prisma.edificio.findUnique({
            where: { id_edificio: Number(id) },
        });
        if (!existingEdificio) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        await prisma.edificio.delete({
            where: { id_edificio: Number(id) },
        });
        return res.json({ message: 'Edificio eliminado exitosamente' });
    }
    catch (error) {
        console.error('Delete edificio error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get eventos
app.get('/api/eventos', async (req, res) => {
    try {
        const { publico, activo } = req.query;
        const where = {};
        if (publico !== undefined)
            where.publico = publico === 'true';
        if (activo !== undefined)
            where.activo = activo === 'true';
        const eventos = await prisma.evento.findMany({
            where,
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
            },
            orderBy: { fecha_inicio: 'asc' },
        });
        return res.json(eventos);
    }
    catch (error) {
        console.error('Get eventos error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get evento
app.get('/api/eventos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const evento = await prisma.evento.findUnique({
            where: { id_evento: Number(id) },
            include: {
                edificio: true,
            },
        });
        if (!evento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        return res.json(evento);
    }
    catch (error) {
        console.error('Get evento error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create evento
app.post('/api/eventos', authenticate, requireAdmin, async (req, res) => {
    try {
        const data = createEventoSchema.parse(req.body);
        const edificio = await prisma.edificio.findUnique({
            where: { id_edificio: data.id_edificio },
        });
        if (!edificio) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        const creadorId = parseInt(req.user.userId);
        const usuarioCreador = await prisma.usuario.findUnique({
            where: { id_usuario: creadorId }
        });
        let prioridadVal = usuarioCreador?.prioridad || 3;
        if (usuarioCreador?.rol === 'rector')
            prioridadVal = 4;
        else if (usuarioCreador?.rol === 'profesor')
            prioridadVal = 3;
        const evaluacion = await evaluarEvento({
            ...data,
            prioridad: prioridadVal
        });
        if (!evaluacion.permitir) {
            return res.status(409).json({ error: evaluacion.mensaje });
        }
        const evento = await prisma.evento.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                fecha_inicio: new Date(data.fecha_inicio),
                fecha_fin: new Date(data.fecha_fin),
                id_edificio: data.id_edificio,
                publico: data.publico ?? true,
                activo: data.activo ?? true,
                id_creador: creadorId,
                prioridad_evento: prioridadVal
            },
            include: {
                edificio: true,
            },
        });
        const responsePayload = { ...evento };
        if (evaluacion.tipo === "DESPLAZAMIENTO_REALIZADO") {
            responsePayload.warning = "El evento fue agendado. Nuestro modelo de IA desplazó automáticamente otro(s) evento(s) de menor prioridad a otras sedes disponibles.";
        }
        return res.status(201).json(responsePayload);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Create evento error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Update evento
app.put('/api/eventos/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateEventoSchema.parse(req.body);
        const existingEvento = await prisma.evento.findUnique({
            where: { id_evento: Number(id) },
        });
        if (!existingEvento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        if (data.id_edificio) {
            const edificio = await prisma.edificio.findUnique({
                where: { id_edificio: data.id_edificio },
            });
            if (!edificio) {
                return res.status(404).json({ error: 'Edificio no encontrado' });
            }
        }
        const updateData = {};
        if (data.nombre)
            updateData.nombre = data.nombre;
        if (data.descripcion !== undefined)
            updateData.descripcion = data.descripcion;
        if (data.fecha_inicio)
            updateData.fecha_inicio = new Date(data.fecha_inicio);
        if (data.fecha_fin)
            updateData.fecha_fin = new Date(data.fecha_fin);
        if (data.id_edificio)
            updateData.id_edificio = data.id_edificio;
        if (data.publico !== undefined)
            updateData.publico = data.publico;
        if (data.activo !== undefined)
            updateData.activo = data.activo;
        const creadorId = Number(req.user.userId);
        const usuarioCreador = await prisma.usuario.findUnique({
            where: { id_usuario: creadorId }
        });
        let prioridadVal = usuarioCreador?.prioridad || 3;
        if (usuarioCreador?.rol === 'rector')
            prioridadVal = 4;
        else if (usuarioCreador?.rol === 'profesor')
            prioridadVal = 3;
        if (data.fecha_inicio || data.fecha_fin || data.id_edificio) {
            const dummyEvento = {
                ...existingEvento,
                ...updateData,
                prioridad: prioridadVal
            };
            const evaluacion = await evaluarEvento(dummyEvento);
            if (!evaluacion.permitir) {
                return res.status(409).json({ error: evaluacion.mensaje });
            }
        }
        const evento = await prisma.evento.update({
            where: { id_evento: Number(id) },
            data: updateData,
            include: {
                edificio: true,
            },
        });
        return res.json(evento);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Update evento error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Delete evento
app.delete('/api/eventos/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existingEvento = await prisma.evento.findUnique({
            where: { id_evento: Number(id) },
        });
        if (!existingEvento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        await prisma.evento.delete({
            where: { id_evento: Number(id) },
        });
        return res.json({ message: 'Evento eliminado exitosamente' });
    }
    catch (error) {
        console.error('Delete evento error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get rutas
app.get('/api/rutas', async (req, res) => {
    try {
        const { tipo, activo, origen_tipo, destino_tipo } = req.query;
        const where = {};
        if (tipo)
            where.tipo = tipo;
        if (activo !== undefined)
            where.activo = activo === 'true';
        if (origen_tipo)
            where.origen_tipo = origen_tipo;
        if (destino_tipo)
            where.destino_tipo = destino_tipo;
        const rutas = await prisma.ruta.findMany({
            where,
            include: {
                detalles: {
                    orderBy: { orden: 'asc' },
                },
            },
            orderBy: { id_ruta: 'desc' },
        });
        return res.json(rutas);
    }
    catch (error) {
        console.error('Get rutas error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get ruta
app.get('/api/rutas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ruta = await prisma.ruta.findUnique({
            where: { id_ruta: Number(id) },
            include: {
                detalles: {
                    orderBy: { orden: 'asc' },
                },
            },
        });
        if (!ruta) {
            return res.status(404).json({ error: 'Ruta no encontrada' });
        }
        return res.json(ruta);
    }
    catch (error) {
        console.error('Get ruta error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Calcular ruta
app.post('/api/rutas/find', authenticate, async (req, res) => {
    try {
        const { origen_tipo, origen_id, destino_tipo, destino_id } = req.body;
        if (!origen_tipo || !origen_id || !destino_tipo || !destino_id) {
            return res.status(400).json({ error: 'Se requieren origen y destino' });
        }
        const ruta = await prisma.ruta.findFirst({
            where: {
                origen_tipo,
                origen_id: parseInt(origen_id),
                destino_tipo,
                destino_id: parseInt(destino_id),
                activo: true,
            },
            include: {
                detalles: {
                    orderBy: { orden: 'asc' },
                },
            },
        });
        if (!ruta) {
            return res.status(404).json({ error: 'No se encontró una ruta entre estos puntos' });
        }
        return res.json(ruta);
    }
    catch (error) {
        console.error('Find route error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create ruta
app.post('/api/rutas', authenticate, requireAdmin, async (req, res) => {
    try {
        const data = createRutaSchema.parse(req.body);
        const ruta = await prisma.ruta.create({
            data: {
                tipo: data.tipo,
                origen_tipo: data.origen_tipo,
                origen_id: data.origen_id,
                destino_tipo: data.destino_tipo,
                destino_id: data.destino_id,
                tiempo_estimado: data.tiempo_estimado,
                activo: data.activo ?? true,
                detalles: data.detalles ? {
                    create: data.detalles,
                } : undefined,
            },
            include: {
                detalles: {
                    orderBy: { orden: 'asc' },
                },
            },
        });
        return res.status(201).json(ruta);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Create ruta error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Update ruta
app.put('/api/rutas/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateRutaSchema.parse(req.body);
        const existingRuta = await prisma.ruta.findUnique({
            where: { id_ruta: Number(id) },
        });
        if (!existingRuta) {
            return res.status(404).json({ error: 'Ruta no encontrada' });
        }
        const ruta = await prisma.ruta.update({
            where: { id_ruta: Number(id) },
            data,
            include: {
                detalles: {
                    orderBy: { orden: 'asc' },
                },
            },
        });
        return res.json(ruta);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Update ruta error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Delete ruta
app.delete('/api/rutas/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existingRuta = await prisma.ruta.findUnique({
            where: { id_ruta: Number(id) },
        });
        if (!existingRuta) {
            return res.status(404).json({ error: 'Ruta no encontrada' });
        }
        await prisma.ruta.delete({
            where: { id_ruta: Number(id) },
        });
        return res.json({ message: 'Ruta eliminada exitosamente' });
    }
    catch (error) {
        console.error('Delete ruta error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Agregar detalle a ruta
app.post('/api/rutas/:id/detalles', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const data = createRutaDetalleSchema.parse(req.body);
        const ruta = await prisma.ruta.findUnique({
            where: { id_ruta: Number(id) },
        });
        if (!ruta) {
            return res.status(404).json({ error: 'Ruta no encontrada' });
        }
        const detalle = await prisma.rutaDetalle.create({
            data: {
                id_ruta: Number(id),
                orden: data.orden,
                instruccion: data.instruccion,
                latitud: data.latitud,
                longitud: data.longitud,
            },
        });
        return res.status(201).json(detalle);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('Add detalle error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Delete detalle
app.delete('/api/rutas/detalles/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existingDetalle = await prisma.rutaDetalle.findUnique({
            where: { id_detalle: Number(id) },
        });
        if (!existingDetalle) {
            return res.status(404).json({ error: 'Detalle no encontrado' });
        }
        await prisma.rutaDetalle.delete({
            where: { id_detalle: Number(id) },
        });
        return res.json({ message: 'Detalle eliminado' });
    }
    catch (error) {
        console.error('Delete detalle error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get all salones
app.get('/api/edificios/salones', async (req, res) => {
    try {
        const salones = await prisma.salon.findMany({
            include: {
                edificio: {
                    select: {
                        id_edificio: true,
                        nombre: true,
                        tipo: true,
                    },
                },
            },
            orderBy: [
                { id_edificio: 'asc' },
                { piso: 'asc' },
            ],
        });
        return res.json(salones);
    }
    catch (error) {
        console.error('Get salones error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get salones by edificio
app.get('/api/edificios/:id/salones', async (req, res) => {
    try {
        const { id } = req.params;
        const salones = await prisma.salon.findMany({
            where: { id_edificio: Number(id) },
            orderBy: { piso: 'asc' },
        });
        return res.json(salones);
    }
    catch (error) {
        console.error('Get salones by edificio error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create salon (admin)
app.post('/api/edificios/:id/salones', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, piso, tipo, activo } = req.body;
        const edificio = await prisma.edificio.findUnique({
            where: { id_edificio: Number(id) },
        });
        if (!edificio) {
            return res.status(404).json({ error: 'Edificio no encontrado' });
        }
        const salon = await prisma.salon.create({
            data: {
                id_edificio: Number(id),
                nombre,
                piso,
                tipo,
                activo: activo !== undefined ? activo : true,
            },
            include: {
                edificio: {
                    select: {
                        id_edificio: true,
                        nombre: true,
                        tipo: true,
                    },
                },
            },
        });
        return res.status(201).json(salon);
    }
    catch (error) {
        console.error('Create salon error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Update salon (admin)
app.put('/api/edificios/salones/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, piso, tipo, activo, id_edificio } = req.body;
        const existingSalon = await prisma.salon.findUnique({
            where: { id_salon: Number(id) },
        });
        if (!existingSalon) {
            return res.status(404).json({ error: 'Salón no encontrado' });
        }
        const updateData = {};
        if (nombre !== undefined)
            updateData.nombre = nombre;
        if (piso !== undefined)
            updateData.piso = piso;
        if (tipo !== undefined)
            updateData.tipo = tipo;
        if (activo !== undefined)
            updateData.activo = activo;
        if (id_edificio !== undefined)
            updateData.id_edificio = id_edificio;
        const salon = await prisma.salon.update({
            where: { id_salon: Number(id) },
            data: updateData,
            include: {
                edificio: {
                    select: {
                        id_edificio: true,
                        nombre: true,
                        tipo: true,
                    },
                },
            },
        });
        return res.json(salon);
    }
    catch (error) {
        console.error('Update salon error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Delete salon (admin)
app.delete('/api/edificios/salones/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existingSalon = await prisma.salon.findUnique({
            where: { id_salon: Number(id) },
        });
        if (!existingSalon) {
            return res.status(404).json({ error: 'Salón no encontrado' });
        }
        await prisma.salon.delete({
            where: { id_salon: Number(id) },
        });
        return res.json({ message: 'Salón eliminado exitosamente' });
    }
    catch (error) {
        console.error('Delete salon error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get all profesores
app.get('/api/profesores', async (req, res) => {
    try {
        const profesor = await prisma.profesor.findMany({
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        correo: true,
                    }
                },
                cubiculos: {
                    include: {
                        edificio: {
                            select: {
                                id_edificio: true,
                                nombre: true,
                                latitud: true,
                                longitud: true,
                                tipo: true,
                            },
                        },
                    },
                },
            },
        });
        return res.json(profesor);
    }
    catch (error) {
        console.error('Get profesores error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Get single profesor
app.get('/api/profesores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const profesor = await prisma.profesor.findUnique({
            where: { id_profesor: Number(id) },
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        correo: true,
                    }
                },
                cubiculos: {
                    include: {
                        edificio: true,
                    },
                },
            },
        });
        if (!profesor) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }
        return res.json(profesor);
    }
    catch (error) {
        console.error('Get profesor error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Create profesor (admin)
app.post('/api/profesores', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id_usuario, departamento, id_cubiculo, activo } = req.body;
        if (!id_usuario || !departamento) {
            return res.status(400).json({ error: 'id_usuario y departamento son requeridos' });
        }
        // Verificar si el usuario existe
        const usuario = await prisma.usuario.findUnique({
            where: { id_usuario: parseInt(id_usuario) },
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Verificar si el usuario ya es profesor
        const existingProfesor = await prisma.profesor.findUnique({
            where: { id_usuario: parseInt(id_usuario) },
        });
        if (existingProfesor) {
            return res.status(400).json({ error: 'El usuario ya es un profesor' });
        }
        // Verificar que el cubículo existe si se proporciona
        if (id_cubiculo) {
            const cubiculo = await prisma.cubiculo.findUnique({
                where: { id_cubiculo: parseInt(id_cubiculo) },
            });
            if (!cubiculo) {
                return res.status(404).json({ error: 'Cubículo no encontrado' });
            }
        }
        await prisma.usuario.update({
            where: { id_usuario: parseInt(id_usuario) },
            data: { rol: 'profesor' }
        });
        const profesor = await prisma.profesor.create({
            data: {
                id_usuario: parseInt(id_usuario),
                departamento,
                activo: activo !== undefined ? activo : true,
            },
            include: {
                usuario: {
                    select: { nombre: true, correo: true }
                },
                cubiculos: {
                    include: {
                        edificio: {
                            select: {
                                id_edificio: true,
                                nombre: true,
                                latitud: true,
                                longitud: true,
                                tipo: true,
                            },
                        },
                    },
                },
            },
        });
        if (id_cubiculo) {
            await prisma.cubiculo.update({
                where: { id_cubiculo: parseInt(id_cubiculo) },
                data: { id_profesor: profesor.id_profesor }
            });
        }
        return res.status(201).json(profesor);
    }
    catch (error) {
        console.error('Create profesor error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Update profesor (admin)
app.put('/api/profesores/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { departamento, id_cubiculo, activo } = req.body;
        const existingProfesor = await prisma.profesor.findUnique({
            where: { id_profesor: Number(id) },
        });
        if (!existingProfesor) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }
        // Verificar que el cubículo existe si se proporciona
        if (id_cubiculo) {
            const cubiculo = await prisma.cubiculo.findUnique({
                where: { id_cubiculo: Number(id_cubiculo) },
            });
            if (!cubiculo) {
                return res.status(404).json({ error: 'Cubículo no encontrado' });
            }
        }
        const updateData = {};
        if (departamento !== undefined)
            updateData.departamento = departamento;
        if (activo !== undefined)
            updateData.activo = activo;
        const profesor = await prisma.profesor.update({
            where: { id_profesor: Number(id) },
            data: updateData,
            include: {
                usuario: {
                    select: { nombre: true, correo: true }
                },
                cubiculos: {
                    include: {
                        edificio: {
                            select: {
                                id_edificio: true,
                                nombre: true,
                                latitud: true,
                                longitud: true,
                                tipo: true,
                            },
                        },
                    },
                },
            },
        });
        if (id_cubiculo) {
            await prisma.cubiculo.update({
                where: { id_cubiculo: parseInt(id_cubiculo) },
                data: { id_profesor: profesor.id_profesor }
            });
        }
        return res.json(profesor);
    }
    catch (error) {
        console.error('Update profesor error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Delete profesor (admin)
app.delete('/api/profesores/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const existingProfesor = await prisma.profesor.findUnique({
            where: { id_profesor: Number(id) },
        });
        if (!existingProfesor) {
            return res.status(404).json({ error: 'Profesor no encontrado' });
        }
        await prisma.profesor.delete({
            where: { id_profesor: Number(id) },
        });
        return res.json({ message: 'Profesor eliminado exitosamente' });
    }
    catch (error) {
        console.error('Delete profesor error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Dashboard
app.get('/api/analytics/dashboard', authenticate, requireAdmin, async (req, res) => {
    try {
        const [totalUsuarios, usuariosActivos, usuariosPendientes, totalEdificios, edificiosActivos, totalSalones, totalProfesores, totalCubiculos, totalEventos, eventosActivos, totalRutas, rutasActivas, totalLogs,] = await Promise.all([
            prisma.usuario.count(),
            prisma.usuario.count({ where: { estado: 'activo' } }),
            prisma.usuario.count({ where: { estado: 'pendiente' } }),
            prisma.edificio.count(),
            prisma.edificio.count({ where: { activo: true } }),
            prisma.salon.count(),
            prisma.profesor.count(),
            prisma.cubiculo.count(),
            prisma.evento.count(),
            prisma.evento.count({ where: { activo: true } }),
            prisma.ruta.count(),
            prisma.ruta.count({ where: { activo: true } }),
            prisma.logAcceso.count(),
        ]);
        return res.json({
            usuarios: {
                total: totalUsuarios,
                activos: usuariosActivos,
                pendientes: usuariosPendientes,
            },
            edificios: {
                total: totalEdificios,
                activos: edificiosActivos,
            },
            salones: totalSalones,
            profesores: totalProfesores,
            cubiculos: totalCubiculos,
            eventos: {
                total: totalEventos,
                activos: eventosActivos,
            },
            rutas: {
                total: totalRutas,
                activas: rutasActivas,
            },
            totalAccesos: totalLogs,
        });
    }
    catch (error) {
        console.error('Get estadisticas para el dashboard error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Edificios por tipo
app.get('/api/analytics/edificios-tipo', authenticate, requireAdmin, async (req, res) => {
    try {
        const edificiosPorTipo = await prisma.edificio.groupBy({
            by: ['tipo'],
            _count: {
                id_edificio: true,
            },
            where: {
                activo: true,
            },
        });
        const result = edificiosPorTipo.map(item => ({
            tipo: item.tipo,
            cantidad: item._count.id_edificio,
        }));
        return res.json(result);
    }
    catch (error) {
        console.error('Get edificios por tipo error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Eventos próximos
app.get('/api/analytics/eventos-proximos', authenticate, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);
        const eventos = await prisma.evento.findMany({
            where: {
                fecha_inicio: {
                    gte: now,
                    lte: futureDate,
                },
                activo: true,
            },
            include: {
                edificio: {
                    select: {
                        nombre: true,
                    },
                },
            },
            orderBy: { fecha_inicio: 'asc' },
            take: 10,
        });
        return res.json(eventos);
    }
    catch (error) {
        console.error('Get eventos próximos error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Accesos recientes
app.get('/api/analytics/accesos-recientes', authenticate, requireAdmin, async (req, res) => {
    try {
        const { days = '7' } = req.query;
        const daysNumber = parseInt(days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNumber);
        const accesos = await prisma.logAcceso.findMany({
            where: {
                fecha: {
                    gte: startDate,
                },
            },
            include: {
                usuario: {
                    select: {
                        nombre: true,
                        correo: true,
                        rol: true,
                    },
                },
            },
            orderBy: { fecha: 'desc' },
            take: 50,
        });
        return res.json(accesos);
    }
    catch (error) {
        console.error('Get accesos recientes error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Accesos timeline
app.get('/api/analytics/accesos-timeline', authenticate, requireAdmin, async (req, res) => {
    try {
        const { days = '30' } = req.query;
        const daysNumber = parseInt(days);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNumber);
        const accesos = await prisma.logAcceso.findMany({
            where: {
                fecha: {
                    gte: startDate,
                },
            },
            select: {
                fecha: true,
            },
        });
        const accesosPorDia = accesos.reduce((acc, curr) => {
            const date = curr.fecha.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const result = Object.entries(accesosPorDia).map(([fecha, count]) => ({
            fecha,
            accesos: count,
        }));
        return res.json(result);
    }
    catch (error) {
        console.error('Get accesos timeline error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Usuarios por rol
app.get('/api/analytics/usuarios-rol', authenticate, requireAdmin, async (req, res) => {
    try {
        const usuariosPorRol = await prisma.usuario.groupBy({
            by: ['rol', 'estado'],
            _count: {
                id_usuario: true,
            },
        });
        const result = usuariosPorRol.map(item => ({
            rol: item.rol,
            estado: item.estado,
            cantidad: item._count.id_usuario,
        }));
        return res.json(result);
    }
    catch (error) {
        console.error('Get usuarios por rol error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Rutas populares
app.get('/api/analytics/rutas-populares', authenticate, requireAdmin, async (req, res) => {
    try {
        const rutas = await prisma.ruta.findMany({
            where: {
                activo: true,
            },
            select: {
                id_ruta: true,
                tipo: true,
                origen_tipo: true,
                origen_id: true,
                destino_tipo: true,
                destino_id: true,
                tiempo_estimado: true,
            },
            take: 10,
        });
        return res.json(rutas);
    }
    catch (error) {
        console.error('Get rutas populares error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
app.get('/api/mapa/data', async (req, res) => {
    try {
        const edificios = await prisma.edificio.findMany({ where: { activo: true } });
        const caminos = await prisma.caminoGeografico.findMany({ where: { activo: true } });
        const geojson = {
            type: "FeatureCollection",
            features: [
                ...edificios.map(b => ({
                    type: "Feature",
                    properties: {
                        name: b.nombre,
                        type: 'building',
                        id: b.id_edificio,
                        descripcion: b.descripcion
                    },
                    geometry: {
                        type: "Point",
                        coordinates: [Number(b.longitud), Number(b.latitud)]
                    }
                })),
                ...caminos.map(c => ({
                    type: "Feature",
                    properties: {
                        type: c.tipo,
                        id: c.id_camino
                    },
                    geometry: c.geometria
                }))
            ]
        };
        res.json(geojson);
    }
    catch (error) {
        console.error('Error fetching map data:', error);
        res.status(500).json({ error: 'Error interno del servidor al cargar mapas' });
    }
});
app.post('/api/google/compute-route', authenticate, async (req, res) => {
    try {
        const { originCoords, destinationCoords, routingPreference = 'TRAFFIC_UNAWARE' } = req.body;
        if (!originCoords || !destinationCoords) {
            return res.status(400).json({ error: 'Faltan coordenadas de origen o destino' });
        }
        const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
            },
            body: JSON.stringify({
                origin: { location: { latLng: originCoords } },
                destination: { location: { latLng: destinationCoords } },
                travelMode: 'WALK',
                routingPreference: routingPreference,
                computeAlternativeRoutes: false,
                languageCode: 'es-MX',
                units: 'METRIC'
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error('Error en Google Maps API');
        }
        return res.json(data);
    }
    catch (error) {
        console.error('Error al calcular ruta con Google:', error);
        return res.status(500).json({ error: 'No se pudo calcular la ruta' });
    }
});
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
    });
});
app.listen(PORT, () => {
    console.log(`
    |----------------------------------------------------------------|
    |                                                                |
    |    AirGuide Server                                             |
    |                                                                |
    |     Server running on: ${process.env.API_URL}                  |
    |     Environment: ${process.env.NODE_ENV || 'development'}      |
    |     Inicio: ${new Date().toLocaleString()}                     |
    |                                                                |
    |                                                                |
    |----------------------------------------------------------------|
  `);
});
export default app;
//# sourceMappingURL=server.js.map