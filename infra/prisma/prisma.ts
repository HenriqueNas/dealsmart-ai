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

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

// Declare global type for prisma in development
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma Client instance with configuration
 */
function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * Singleton pattern:
 * - In production: Create a new client for each serverless function instance
 * - In development: Reuse the same client to prevent too many connections
 */
export const prisma: PrismaClient = globalThis.prisma ?? createPrismaClient();

// In development, store the client in global to persist across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
