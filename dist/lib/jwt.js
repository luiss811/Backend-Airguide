import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || '67c87664b5bba0c8746a21b017b4ea71';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d'
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