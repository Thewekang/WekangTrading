import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProduction = process.env.NODE_ENV === 'production';

// Simple Prisma client for Supabase PostgreSQL
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: isProduction ? ['error'] : ['error', 'warn'],
});

if (!isProduction) globalForPrisma.prisma = prisma;
