import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validator.js';
import { createEdificioSchema, updateEdificioSchema } from './edificio.validator.js';
import { createEventoSchema, updateEventoSchema } from './evento.validator.js';
import { createRutaSchema, updateRutaSchema, createRutaDetalleSchema } from './ruta.validator.js';

describe('Zod Validators', () => {
  describe('Auth Validators', () => {
    it('loginSchema validates email and password length', () => {
      expect(() => loginSchema.parse({ correo: 'test@domain.com', password: 'password123' })).not.toThrow();
      expect(() => loginSchema.parse({ correo: 'invalid-email', password: '123' })).toThrow();
    });

    it('registerSchema validates role and required fields', () => {
      expect(() => registerSchema.parse({
        nombre: 'User', correo: 'u@d.com', password: 'password123', matricula: 'A123',
      })).not.toThrow();
      expect(() => registerSchema.parse({ nombre: 'U', correo: 'u@d.com', password: '123' })).toThrow();
    });

    it('forgotPasswordSchema & resetPasswordSchema validate correctly', () => {
      expect(() => forgotPasswordSchema.parse({ correo: 'u@d.com' })).not.toThrow();
      expect(() => resetPasswordSchema.parse({ correo: 'u@d.com', codigo: '123456', newPassword: 'password123' })).not.toThrow();
    });
  });

  describe('Edificio Validators', () => {
    it('createEdificioSchema & updateEdificioSchema validate lat/lng and names', () => {
      expect(() => createEdificioSchema.parse({
        nombre: 'Edificio A', latitud: 20.6, longitud: -100.4, tipo: 'academico',
      })).not.toThrow();
      expect(() => createEdificioSchema.parse({ nombre: 'X' })).toThrow();

      expect(() => updateEdificioSchema.parse({ latitud: 20.6 })).not.toThrow();
    });
  });

  describe('Evento Validators', () => {
    it('createEventoSchema & updateEventoSchema validate fields', () => {
      expect(() => createEventoSchema.parse({
        nombre: 'Conferencia Tech', id_edificio: 1, prioridad_evento: 3,
      })).not.toThrow();

      expect(() => updateEventoSchema.parse({ nombre: 'Nuevo Nombre Largo', prioridad_evento: 3 })).not.toThrow();
    });
  });

  describe('Ruta Validators', () => {
    it('createRutaSchema, updateRutaSchema, createRutaDetalleSchema validate route structures', () => {
      expect(() => createRutaSchema.parse({
        tipo: 'interna',
        origen_tipo: 'edificio',
        origen_id: 1,
        destino_tipo: 'salon',
        destino_id: 2,
        detalles: [{ orden: 1, instruccion: 'Caminar derecho', latitud: 20.6, longitud: -100.4 }],
      })).not.toThrow();

      expect(() => updateRutaSchema.parse({
        tipo: 'externa',
        origen_tipo: 'cubiculo',
        origen_id: 5,
        destino_tipo: 'evento',
        destino_id: 10,
        tiempo_estimado: 15,
        activo: true,
      })).not.toThrow();

      expect(() => createRutaDetalleSchema.parse({
        orden: 1, instruccion: 'Girar a la derecha', latitud: 20.6, longitud: -100.4,
      })).not.toThrow();
    });
  });
});
