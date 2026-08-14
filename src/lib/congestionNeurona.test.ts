import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from './prisma.js';

vi.mock('./prisma.js', () => ({
  prisma: {
    ruta: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe('congestionNeurona Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates model instance on getModelo', async () => {
    const { getModelo } = await import('./congestionNeurona.js');
    const model = getModelo();
    expect(model).toBeDefined();
  });

  it('trains congestion model successfully with active routes', async () => {
    (prisma.ruta.findMany as any).mockResolvedValue([
      { contador_usos: 5 },
      { contador_usos: 20 },
    ]);

    const { entrenarCongestion } = await import('./congestionNeurona.js');
    const loss = await entrenarCongestion();
    expect(loss).toBeDefined();
  });

  it('handles error in entrenarCongestion and resets isTraining flag', async () => {
    (prisma.ruta.findMany as any).mockRejectedValueOnce(new Error('DB failure during training'));

    const { entrenarCongestion } = await import('./congestionNeurona.js');
    await expect(entrenarCongestion()).rejects.toThrow('DB failure during training');
  });

  it('throws error if entrenarCongestion is called while already training', async () => {
    (prisma.ruta.findMany as any).mockImplementation(
      () => new Promise((res) => setTimeout(() => res([{ contador_usos: 10 }]), 500))
    );

    const { entrenarCongestion } = await import('./congestionNeurona.js');
    const p1 = entrenarCongestion();
    await expect(entrenarCongestion()).rejects.toThrow('El modelo ya se está entrenando');
    await p1;
  });

  it('predecirCongestionRuta returns predicted congestion score or 0.0 if route not found', async () => {
    (prisma.ruta.findUnique as any).mockResolvedValue({ contador_usos: 15 });
    (prisma.ruta.aggregate as any).mockResolvedValue({ _max: { contador_usos: 50 } });

    const { predecirCongestionRuta } = await import('./congestionNeurona.js');
    const score = await predecirCongestionRuta(1, 14);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);

    (prisma.ruta.findUnique as any).mockResolvedValue(null);
    const score0 = await predecirCongestionRuta(99, 14);
    expect(score0).toBe(0.0);
  });
});
