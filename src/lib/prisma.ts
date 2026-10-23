import { PrismaClient } from '@prisma/client';
<<<<<<< HEAD
=======
import dotenv from 'dotenv';

dotenv.config();
>>>>>>> bc35b8ee1a255e53daffa306a1b142de0e05507d

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
