import { z } from 'zod';

export const createEventoSchema = z.object({
  nombre: z.string().min(8, 'El nombre debe tener al menos 8 caracteres'),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  fecha_fin: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  id_edificio: z.number().int().positive('ID de edificio inválido'),
  publico: z.boolean().optional(),
  activo: z.boolean().optional(),
  id_creador: z.number().int().positive('Usuario no valido').optional(),
  prioridad_evento: z.number().int().min(1).max(5),
  total_invitados: z.number().int().min(0).optional(),
  es_de_paga: z.boolean().optional(),
  precio: z.number().min(0).optional(),
});

export const updateEventoSchema = z.object({
  nombre: z.string().min(8, 'El nombre debe tener al menos 8 caracteres').optional(),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  fecha_fin: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  id_edificio: z.number().int().positive('ID de edificio inválido').optional(),
  publico: z.boolean().optional(),
  activo: z.boolean().optional(),
  id_creador: z.number().int().positive('Usuario no valido').optional(),
  prioridad_evento: z.number().int().min(1).max(5),
  total_invitados: z.number().int().min(0).optional(),
  es_de_paga: z.boolean().optional(),
  precio: z.number().min(0).optional(),
});

export type CreateEventoInput = z.infer<typeof createEventoSchema>;
export type UpdateEventoInput = z.infer<typeof updateEventoSchema>;
