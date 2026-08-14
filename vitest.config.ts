import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30000,
    env: {
      JWT_SECRET: 'secretodePruebaParaUnitaria1234567890',
      PORT_AUTH: '3011',
      PORT_BUILDINGS: '3012',
      PORT_EVENTS: '3013',
      PORT_NAV: '3014',
      PORT_ANALYTICS: '3015',
      PORT_PROFESORES: '3016',
      PORT: '3010',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      exclude: [
        'src/prisma/seed.ts',
        'scripts/**',
        'dist/**',
        'node_modules/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        statements: 95,
        branches: 80,
        functions: 95,
        lines: 95,
      },
    },
  },
});
