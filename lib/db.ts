import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProduction = process.env.NODE_ENV === 'production';

// Create Prisma client with LibSQL adapter for Turso (serverComponentsExternalPackages)
async function createPrismaClient() {
  // In production, use Turso via adapter
  if (isProduction && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const adapterModule = await import('@prisma/adapter-libsql');
    const PrismaLibSql = adapterModule.PrismaLibSql || (adapterModule as any).default;
    const { createClient } = await import('@libsql/client');
    
    const libsqlConfig = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };

    const adapter = new PrismaLibSql(libsqlConfig);

    return new PrismaClient({
      adapter,
      log: ['error'],
    } as any);
  }

  // In development, use local SQLite or regular connection
  return new PrismaClient({
    log: isProduction ? ['error'] : ['error', 'warn'],
  });
}

// Initialize client synchronously for development, lazy-load for production
export const prisma = globalForPrisma.prisma ?? (
  isProduction && process.env.TURSO_DATABASE_URL 
    ? (createPrismaClient() as any as PrismaClient) 
    : new PrismaClient({ log: isProduction ? ['error'] : ['error', 'warn'] })
);

if (!isProduction) globalForPrisma.prisma = prisma;
