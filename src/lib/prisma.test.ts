import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Prisma Client singleton', () => {
  beforeEach(() => {
    delete (globalThis as any).prisma;
    vi.resetModules();
  });

  it('instantiates PrismaClient with development log options if NODE_ENV is development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { prisma } = await import('./prisma.js');
    expect(prisma).toBeDefined();
    expect((globalThis as any).prisma).toBeDefined();

    const { prisma: secondImport } = await import('./prisma.js');
    expect(secondImport).toBe(prisma);

    process.env.NODE_ENV = originalEnv;
  });

  it('instantiates PrismaClient in production environment without setting globalThis', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { prisma } = await import('./prisma.js');
    expect(prisma).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});
