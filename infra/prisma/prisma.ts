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

import { PrismaClient } from './generated';

// Declare global type for prisma in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma Client instance with configuration
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

/**
 * Singleton pattern:
 * - In production: Create a new client for each serverless function instance
 * - In development: Reuse the same client to prevent too many connections
 */
export const prisma: PrismaClient =
  globalThis.prisma ?? createPrismaClient();

// In development, store the client in global to persist across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
