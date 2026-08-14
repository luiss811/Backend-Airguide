import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'msg-123' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailMock,
    }),
  },
}));

describe('Email Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendOtpEmail sends email with generated template', async () => {
    delete process.env.SMTP_FROM;
    process.env.SMTP_USER = 'no-reply@airguide.com';

    const { sendOtpEmail } = await import('./email.js');
    await sendOtpEmail('user@example.com', 'Juan Perez', '123456');

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Tu código de verificación - AirGuide',
      })
    );
  });

  it('sendPasswordResetEmail sends password reset email template with custom SMTP_FROM', async () => {
    process.env.SMTP_FROM = 'support@airguide.com';

    const { sendPasswordResetEmail } = await import('./email.js');
    await sendPasswordResetEmail('user@example.com', 'Juan Perez', '654321');

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Recuperación de contraseña - AirGuide',
      })
    );
  });
});
