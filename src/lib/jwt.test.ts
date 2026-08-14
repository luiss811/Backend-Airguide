import { describe, it, expect, vi } from 'vitest';
import { generateToken, verifyToken } from './jwt.js';

describe('JWT Utility', () => {
  it('generates and verifies a valid token', () => {
    const payload = { userId: '123', email: 'test@example.com', role: 'admin' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws an error on invalid or expired token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow('Token inválido o expirado');
  });

  it('throws an error when JWT_SECRET is missing or too short', async () => {
    const originalEnv = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    vi.resetModules();

    await expect(async () => {
      await import('./jwt.js');
    }).rejects.toThrow('JWT_SECRET variable global no esta definida.');

    process.env.JWT_SECRET = originalEnv;
    vi.resetModules();
  });
});
