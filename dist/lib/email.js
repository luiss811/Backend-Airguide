import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export async function sendOtpEmail(correo, nombre, codigo) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
        from: `"AirGuide" <${from}>`,
        to: correo,
        subject: 'Tu código de verificación - AirGuide',
        html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background-color:#3b82f6;padding:32px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">✈ AirGuide</p>
                    <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe;">Sistema de Navegación Universitaria</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px 24px;">
                    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">Hola, ${nombre} 👋</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                      Recibimos una solicitud de inicio de sesión en tu cuenta de AirGuide. 
                      Usa el siguiente código para completar la verificación:
                    </p>
                    <!-- OTP Code -->
                    <div style="background-color:#eff6ff;border:2px dashed #3b82f6;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Código de verificación</p>
                      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#1d4ed8;font-family:'Courier New',monospace;">${codigo}</p>
                    </div>
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
                      ⏱ Este código expira en <strong>10 minutos</strong>.
                    </p>
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                      Si no intentaste iniciar sesión, puedes ignorar este correo. Tu cuenta está segura.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f3f4f6;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} AirGuide · No respondas a este correo</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    });
}
export async function sendPasswordResetEmail(correo, nombre, codigo) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await transporter.sendMail({
        from: `"AirGuide Soporte" <${from}>`,
        to: correo,
        subject: 'Recuperación de contraseña - AirGuide',
        html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="background-color:#3b82f6;padding:32px;text-align:center;">
                    <p style="margin:0;font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">✈ AirGuide</p>
                    <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe;">Sistema de Navegación Universitaria</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px 24px;">
                    <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;">Hola, ${nombre} 👋</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta en AirGuide. 
                      Usa el siguiente código para crear una nueva contraseña:
                    </p>
                    <!-- OTP Code -->
                    <div style="background-color:#eff6ff;border:2px dashed #3b82f6;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
                      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Código de recuperación</p>
                      <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:12px;color:#1d4ed8;font-family:'Courier New',monospace;">${codigo}</p>
                    </div>
                    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
                      ⏱ Este código expira en <strong>10 minutos</strong>.
                    </p>
                    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                      Si no solicitaste este cambio, puedes ignorar este correo o contactarnos.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f3f4f6;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} AirGuide · No respondas a este correo</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    });
}
//# sourceMappingURL=email.js.map