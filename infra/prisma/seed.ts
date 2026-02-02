/**
 * Database Seed Script
 *
 * Creates sample users for development and testing.
 *
 * Usage:
 *   pnpm db:seed
 *   npx prisma db seed
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from './generated/client';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hashPassword('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dealsmart.ai' },
    update: {},
    create: {
      email: 'admin@dealsmart.ai',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      verified: true,
      ageVerified: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create creator user
  const creatorPassword = await hashPassword('Creator@123');
  const creator = await prisma.user.upsert({
    where: { email: 'creator@dealsmart.ai' },
    update: {},
    create: {
      email: 'creator@dealsmart.ai',
      name: 'Creator User',
      passwordHash: creatorPassword,
      role: Role.CREATOR,
      verified: true,
      ageVerified: true,
    },
  });
  console.log(`Created creator user: ${creator.email}`);

  // Create regular user
  const userPassword = await hashPassword('User@123');
  const user = await prisma.user.upsert({
    where: { email: 'user@dealsmart.ai' },
    update: {},
    create: {
      email: 'user@dealsmart.ai',
      name: 'Regular User',
      passwordHash: userPassword,
      role: Role.USER,
      verified: false,
      ageVerified: false,
    },
  });
  console.log(`Created regular user: ${user.email}`);

  console.log('Database seeding completed!');
  console.log('\nTest Credentials:');
  console.log('  Admin:   admin@dealsmart.ai / Admin@123');
  console.log('  Creator: creator@dealsmart.ai / Creator@123');
  console.log('  User:    user@dealsmart.ai / User@123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
