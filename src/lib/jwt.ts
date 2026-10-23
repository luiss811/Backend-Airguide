import jwt from 'jsonwebtoken';

<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET as string;
const longitud_minima = 32;

if (!JWT_SECRET || JWT_SECRET.length < longitud_minima) {
  throw new Error('JWT_SECRET variable global no esta definida.');
}
=======
const JWT_SECRET = process.env.JWT_SECRET || '67c87664b5bba0c8746a21b017b4ea71';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
<<<<<<< HEAD
    expiresIn: '1d',
=======
    expiresIn: '1d'
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}
