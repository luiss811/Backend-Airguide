import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMailMock = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailMock,
    }),
  },
}));

describe('Mailer Utility', () => {
  beforeEach(() => {
    sendMailMock.mockReset();
  });

  it('enviarNotificacionDesplazamiento sends displacement email successfully', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'msg-999' });

    const { enviarNotificacionDesplazamiento } = await import('./mailer.js');
    await enviarNotificacionDesplazamiento(
      'profesor@example.com',
      'Profesor Carlos',
      'Conferencia IA',
      'Edificio A',
      'Edificio B',
      new Date('2026-09-01T10:00:00')
    );

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailData = sendMailMock.mock.calls[0][0];
    expect(mailData.to).toBe('profesor@example.com');
    expect(mailData.html).toContain('Profesor Carlos');
    expect(mailData.html).toContain('Conferencia IA');
    expect(mailData.html).toContain('Edificio A');
    expect(mailData.html).toContain('Edificio B');
  });

  it('enviarNotificacionDesplazamiento handles error cleanly on failure', async () => {
    sendMailMock.mockRejectedValue(new Error('SMTP Failure'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { enviarNotificacionDesplazamiento } = await import('./mailer.js');
    await enviarNotificacionDesplazamiento(
      'profesor@example.com',
      'Profesor Carlos',
      'Conferencia IA',
      'Edificio A',
      'Edificio B',
      new Date('2026-09-01T10:00:00')
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error enviando correo a profesor@example.com'),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
