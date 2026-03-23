import { z } from 'zod';

export const createEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre debe tener al menos 1 caracteres'),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().datetime('Fecha inválida'),
  fecha_fin: z.string().datetime('Fecha inválida'),
  id_edificio: z.number().int().positive('ID de edificio inválido'),
  publico: z.boolean().optional(),
  activo: z.boolean().optional(),
});

export const updateEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre debe tener al menos 1 caracteres').optional(),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  fecha_fin: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha inválida').optional(),
  id_edificio: z.number().int().positive('ID de edificio inválido').optional(),
  publico: z.boolean().optional(),
  activo: z.boolean().optional(),
});

export type CreateEventoInput = z.infer<typeof createEventoSchema>;
export type UpdateEventoInput = z.infer<typeof updateEventoSchema>;
