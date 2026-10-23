import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const longitud_minima = 32;

if (!JWT_SECRET || JWT_SECRET.length < longitud_minima) {
  throw new Error('JWT_SECRET variable global no esta definida.');
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d',
  });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}
