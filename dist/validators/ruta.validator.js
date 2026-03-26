import { z } from 'zod';
export const createRutaSchema = z.object({
    tipo: z.enum(['interna', 'externa']),
    origen_tipo: z.enum(['edificio', 'salon', 'cubiculo', 'evento']),
    origen_id: z.number().int().positive('ID de origen inválido'),
    destino_tipo: z.enum(['edificio', 'salon', 'cubiculo', 'evento']),
    destino_id: z.number().int().positive('ID de destino inválido'),
    tiempo_estimado: z.number().int().positive('Tiempo estimado inválido').optional(),
    activo: z.boolean().optional(),
    detalles: z.array(z.object({
        orden: z.number().int().positive(),
        instruccion: z.string().min(5, 'La instrucción debe tener al menos 5 caracteres'),
        latitud: z.number().min(-90).max(90, 'Latitud inválida'),
        longitud: z.number().min(-180).max(180, 'Longitud inválida'),
    })).optional(),
});
export const updateRutaSchema = z.object({
    tipo: z.enum(['interna', 'externa']).optional(),
    origen_tipo: z.enum(['edificio', 'salon', 'cubiculo', 'evento']).optional(),
    origen_id: z.number().int().positive('ID de origen inválido').optional(),
    destino_tipo: z.enum(['edificio', 'salon', 'cubiculo', 'evento']).optional(),
    destino_id: z.number().int().positive('ID de destino inválido').optional(),
    tiempo_estimado: z.number().int().positive('Tiempo estimado inválido').optional(),
    activo: z.boolean().optional(),
});
export const createRutaDetalleSchema = z.object({
    orden: z.number().int().positive(),
    instruccion: z.string().min(5, 'La instrucción debe tener al menos 5 caracteres'),
    latitud: z.number().min(-90).max(90, 'Latitud inválida'),
    longitud: z.number().min(-180).max(180, 'Longitud inválida'),
});
//# sourceMappingURL=ruta.validator.js.map