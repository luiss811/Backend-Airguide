import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;
const longitud_minima = 32;
if (!JWT_SECRET || JWT_SECRET.length < longitud_minima) {
    throw new Error('JWT_SECRET variable global no esta definida.');
}
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d',
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