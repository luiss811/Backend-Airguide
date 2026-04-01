import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../lib/jwt.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// Login
router.post('/login', async (req, res) => {
    try {
        const { correo, password } = loginSchema.parse(req.body);
        const usuario = await prisma.usuario.findUnique({
            where: { correo },
        });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        // Verificar que el usuario esté activo
        if (usuario.estado !== 'activo') {
            return res.status(403).json({ error: 'Usuario no activo. Por favor contacta al administrador.' });
        }
        const isValidPassword = await bcrypt.compare(password, usuario.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        const token = generateToken({
            userId: usuario.id_usuario.toString(),
            email: usuario.correo,
            role: usuario.rol,
        });
        // Registrar log de acceso
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
                estado: usuario.estado,
            },
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
// Register
router.post('/register', async (req, res) => {
    try {
        const { correo, password, nombre, matricula } = registerSchema.parse(req.body);
        // Verificar si el usuario ya existe
        const existingUsuario = await prisma.usuario.findUnique({
            where: { correo },
        });
        if (existingUsuario) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        // Verificar si la matrícula ya existe
        if (matricula) {
            const existingMatricula = await prisma.usuario.findUnique({
                where: { matricula },
            });
            if (existingMatricula) {
                return res.status(400).json({ error: 'La matrícula ya está registrada' });
            }
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Crear usuario
        const usuario = await prisma.usuario.create({
            data: {
                correo,
                password_hash: hashedPassword,
                nombre,
                matricula: matricula ?? "",
                rol: 'alumno',
                estado: 'pendiente', // Requiere validación del admin
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
// Get current user
router.get('/me', authenticate, async (req, res) => {
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
// Admin: Validar usuario
router.put('/validate/:id', authenticate, async (req, res) => {
    try {
        // Verificar que sea admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
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
// Admin/Rector: Listar todos los usuarios
router.get('/all', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'rector') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        const usuarios = await prisma.usuario.findMany({
            select: {
                id_usuario: true,
                correo: true,
                nombre: true,
                matricula: true,
                rol: true,
                estado: true,
            },
            orderBy: { nombre: 'asc' },
        });
        return res.json(usuarios);
    }
    catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Admin: Listar usuarios pendientes
router.get('/pending', authenticate, async (req, res) => {
    try {
        // Verificar que sea admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
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
        console.error('Get pending users error:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
export default router;
//# sourceMappingURL=auth.routes.js.map