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
export const forgotPasswordSchema = z.object({
    correo: z.string().email('Correo inválido'),
});
export const resetPasswordSchema = z.object({
    correo: z.string().email('Correo inválido'),
    codigo: z.string().min(6, 'Código inválido'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});
//# sourceMappingURL=auth.validator.js.map