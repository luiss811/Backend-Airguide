import { z } from 'zod';

export const createEdificioSchema = z.object({
  nombre: z.string().min(1, 'El nombre debe tener al menos 1 caracteres'),
  descripcion: z.string().optional(),
  latitud: z.number().min(-90).max(90, 'Latitud inválida'),
  longitud: z.number().min(-180).max(180, 'Longitud inválida'),
  tipo: z.enum(['academico', 'administrativo', 'recreativo']),
  activo: z.boolean().optional(),
});

export const updateEdificioSchema = z.object({
  nombre: z.string().min(1, 'El nombre debe tener al menos 1 caracteres').optional(),
  descripcion: z.string().optional(),
  latitud: z.number().min(-90).max(90, 'Latitud inválida').optional(),
  longitud: z.number().min(-180).max(180, 'Longitud inválida').optional(),
  tipo: z.enum(['academico', 'administrativo', 'recreativo']).optional(),
  activo: z.boolean().optional(),
});

export type CreateEdificioInput = z.infer<typeof createEdificioSchema>;
export type UpdateEdificioInput = z.infer<typeof updateEdificioSchema>;
