import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export async function enviarNotificacionDesplazamiento(correoProfesor, nombreProfesor, nombreEvento, edificioAnterior, edificioNuevo, fechaEvento) {
    try {
        const fechaFormateada = fechaEvento.toLocaleString('es-MX', {
            dateStyle: 'full',
            timeStyle: 'short',
        });
        const fromAddress = process.env.RESEND_FROM || (resend ? 'Administración de Eventos <onboarding@resend.dev>' : (process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@airguide.com'));
        const subject = `Aviso Importante: Reubicación de su evento "${nombreEvento}"`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #d32f2f;">Notificación de Cambio de Sede</h2>
        <p>Estimado/a <strong>${nombreProfesor}</strong>,</p>
        <p>Le notificamos que debido a un evento de prioridad institucional programado en su mismo horario y ubicación, ha sido necesario reubicar su evento.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Evento:</strong> ${nombreEvento}</p>
          <p style="margin: 5px 0;"><strong>Fecha y Hora:</strong> ${fechaFormateada}</p>
          <p style="margin: 5px 0; color: #757575;"><del><strong>Lugar Anterior:</strong> ${edificioAnterior}</del></p>
          <p style="margin: 5px 0; color: #2e7d32; font-size: 1.1em;"><strong>Nuevo Lugar Asignado:</strong> ${edificioNuevo}</p>
        </div>

        <p>Nuestro sistema automatizado (basado en inteligencia artificial) ha seleccionado esta nueva locación considerando la capacidad y disponibilidad en el mismo horario.</p>
        <p>Agradecemos su comprensión.</p>
        <br>
        <p style="font-size: 0.9em; color: #757575;">Atentamente,<br>Rectoría y Administración General</p>
      </div>
    `;
        if (resend) {
            const { data, error } = await resend.emails.send({
                from: fromAddress,
                to: correoProfesor,
                subject,
                html,
            });
            if (error) {
                throw new Error(`[Resend Error] ${error.message}`);
            }
            console.log(`Correo enviado vía Resend a ${correoProfesor}: ${data?.id}`);
            return;
        }
        const mailOptions = {
            from: `"Administración de Eventos" <${fromAddress}>`,
            to: correoProfesor,
            subject,
            html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`Correo enviado a ${correoProfesor}: ${info.messageId}`);
    }
    catch (error) {
        console.error(`Error enviando correo a ${correoProfesor}:`, error);
    }
}
//# sourceMappingURL=mailer.js.map