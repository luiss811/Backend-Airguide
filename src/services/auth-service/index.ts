import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { generateToken } from '../../lib/jwt.js';
import { sendOtpEmail } from '../../lib/email.js';
import { generateOtp, getOtpExpiry } from '../../lib/otp.js';
import { loginSchema, registerSchema } from '../../validators/auth.validator.js';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth.middleware.js';

const app = express();
app.use(express.json());

// Login
app.post('/login', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login — Step 2: verify OTP and return JWT token
app.post('/verify-2fa', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Resend OTP
app.post('/resend-otp', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Register
app.post('/register', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get usuario
app.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: parseInt(req.user!.userId) },
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
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Validar usuario por parte del administrador
app.put('/validate/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error('Validate user error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get usuarios pendientes de validación
app.get('/pending', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error('Get usuarios pendientes error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get usuarios
app.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT_AUTH || 3011;
app.listen(PORT, () => {  console.log('Servicio de Autenticación corriendo');});
