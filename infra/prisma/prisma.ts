/**
 * Prisma Client Singleton
 *
 * This module provides a singleton instance of the Prisma Client
 * to prevent multiple instances in development (hot reloading)
 * and ensure efficient connection pooling in production.
 *
 * Usage:
 *   import { prisma } from '@/infra/prisma/prisma';
 *   const users = await prisma.user.findMany();
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
