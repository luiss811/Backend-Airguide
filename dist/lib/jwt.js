import jwt from 'jsonwebtoken';
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET;
const longitud_minima = 32;
if (!JWT_SECRET || JWT_SECRET.length < longitud_minima) {
    throw new Error('JWT_SECRET variable global no esta definida.');
}
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d',
=======
const JWT_SECRET = process.env.JWT_SECRET || '67c87664b5bba0c8746a21b017b4ea71';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d'
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d
    });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        throw new Error('Token inválido o expirado');
    }
}
//# sourceMappingURL=jwt.js.map