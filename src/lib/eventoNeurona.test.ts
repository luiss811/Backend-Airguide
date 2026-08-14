import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEdificio = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
};

const mockEvento = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
};

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      edificio = mockEdificio;
      evento = mockEvento;
    },
  };
});

vi.mock('./mailer.js', () => ({
  enviarNotificacionDesplazamiento: vi.fn().mockResolvedValue(undefined),
}));

describe('eventoNeurona Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEdificio.findMany.mockResolvedValue([]);
    mockEvento.findMany.mockResolvedValue([]);
    mockEvento.findFirst.mockResolvedValue(null);
  });

  it('entrenarNeurona initializes and trains neural model with existing events', async () => {
    mockEdificio.findMany.mockResolvedValue([{ id_edificio: 1 }, { id_edificio: 5 }]);
    mockEvento.findMany.mockResolvedValue([
      { fecha_inicio: new Date('2026-08-14T10:00:00'), id_edificio: 2 },
    ]);

    const { entrenarNeurona } = await import('./eventoNeurona.js');
    const result = await entrenarNeurona();

    expect(result).toBeDefined();
    expect(result?.epochs.length).toBe(200);
  });

  it('entrenarNeurona handles empty events database gracefully', async () => {
    const { entrenarNeurona } = await import('./eventoNeurona.js');
    const result = await entrenarNeurona();

    expect(result).toBeDefined();
  });

  it('evaluarEvento returns SIN_CONFLICTO when no overlapping events exist', async () => {
    mockEvento.findMany.mockResolvedValue([]);

    const { evaluarEvento } = await import('./eventoNeurona.js');
    const res = await evaluarEvento({
      id_edificio: 1,
      fecha_inicio: '2026-08-14T10:00:00Z',
      fecha_fin: '2026-08-14T12:00:00Z',
      prioridad_evento: 4,
    });

    expect(res).toEqual({ permitir: true, tipo: 'SIN_CONFLICTO' });
  });

  it('evaluarEvento rejects when new event priority is lower or equal to conflicting event', async () => {
    mockEvento.findMany.mockResolvedValue([
      {
        id_evento: 10,
        prioridad_evento: 4,
        nombre: 'Conferencia Principal',
        creador: { correo: 'creador@example.com', nombre: 'Carlos' },
        edificio: { nombre: 'Edificio Central' },
      },
    ]);

    const { evaluarEvento } = await import('./eventoNeurona.js');
    const res = await evaluarEvento({
      id_evento: 20,
      id_edificio: 1,
      fecha_inicio: '2026-08-14T10:00:00Z',
      fecha_fin: '2026-08-14T12:00:00Z',
      prioridad_evento: 3,
    });

    expect(res.permitir).toBe(false);
    expect(res.mensaje).toContain('mayor o igual prioridad');
  });

  it('evaluarEvento successfully displaces a lower priority event when free building is found and sends notification', async () => {
    mockEvento.findMany.mockResolvedValue([
      {
        id_evento: 10,
        id_edificio: 1,
        prioridad_evento: 2,
        nombre: 'Taller Alumnos',
        fecha_inicio: new Date('2026-08-14T10:00:00Z'),
        fecha_fin: new Date('2026-08-14T12:00:00Z'),
        creador: { correo: 'profesor@example.com', nombre: 'Profesor Ana' },
        edificio: { nombre: 'Edificio A' },
      },
    ]);

    mockEdificio.findMany.mockResolvedValue([
      { id_edificio: 2, nombre: 'Edificio B' },
    ]);
    mockEvento.findFirst.mockResolvedValue(null);
    mockEdificio.findUnique.mockResolvedValue({ id_edificio: 2, nombre: 'Edificio B' });
    mockEvento.update.mockResolvedValue({});

    const { evaluarEvento } = await import('./eventoNeurona.js');
    const res = await evaluarEvento({
      id_edificio: 1,
      fecha_inicio: '2026-08-14T10:00:00Z',
      fecha_fin: '2026-08-14T12:00:00Z',
      prioridad_evento: 4,
    });

    expect(res).toEqual({ permitir: true, tipo: 'DESPLAZAMIENTO_REALIZADO' });
    const { enviarNotificacionDesplazamiento } = await import('./mailer.js');
    expect(enviarNotificacionDesplazamiento).toHaveBeenCalledWith(
      'profesor@example.com',
      'Profesor Ana',
      'Taller Alumnos',
      'Edificio A',
      'Edificio B',
      expect.any(Date)
    );
  });

  it('evaluarEvento returns false if no alternative buildings are free', async () => {
    mockEvento.findMany.mockResolvedValue([
      {
        id_evento: 10,
        id_edificio: 1,
        prioridad_evento: 1,
        nombre: 'Evento Ocupante',
        fecha_inicio: new Date('2026-08-14T10:00:00Z'),
        fecha_fin: new Date('2026-08-14T12:00:00Z'),
        creador: null,
        edificio: { nombre: 'Edificio A' },
      },
    ]);

    mockEdificio.findMany.mockResolvedValue([
      { id_edificio: 2, nombre: 'Edificio B' },
    ]);
    mockEvento.findFirst.mockResolvedValue({ id_evento: 99 });

    const { evaluarEvento } = await import('./eventoNeurona.js');
    const res = await evaluarEvento({
      id_edificio: 1,
      fecha_inicio: '2026-08-14T10:00:00Z',
      fecha_fin: '2026-08-14T12:00:00Z',
      prioridad_evento: 5,
    });

    expect(res.permitir).toBe(false);
    expect(res.mensaje).toContain('No hay edificios alternativos disponibles');
  });
});
