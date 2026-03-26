import { z } from 'zod';
export const loginSchema = z.object({
    correo: z.string().email('Correo inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});
export const registerSchema = z.object({
    correo: z.string().email('Correo inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    matricula: z.string().optional(),
});
//# sourceMappingURL=auth.validator.js.map