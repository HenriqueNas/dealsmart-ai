/**
 * Database Seed Script
 *
 * Creates sample users for development and testing.
 *
 * Usage:
 *   pnpm db:seed
 *   npx prisma db seed
 */

import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import {
  ConversationStatus,
  PrismaClient,
  Role,
  SenderType,
} from './generated/client';

import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
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

  // =========================================================================
  // SAMPLE CONVERSATIONS & MESSAGES
  // =========================================================================

  console.log('\nSeeding conversations...');

  // Conversation 1: Sarah Chen - BMW X5 inquiry
  const conv1 = await prisma.conversation.upsert({
    where: { id: 'conv-sarah-chen' },
    update: {},
    create: {
      id: 'conv-sarah-chen',
      hubspotContactId: 'hs-contact-sarah',
      customerName: 'Sarah Chen',
      customerEmail: 'sarah.chen@email.com',
      customerPhone: '+1-555-0101',
      status: ConversationStatus.IN_PROGRESS,
      assignedToId: admin.id,
      lastMessageAt: new Date('2026-02-03T14:30:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderType: SenderType.CUSTOMER,
        content:
          'Hi, I saw your ad for the 2024 BMW X5. Is it still available?',
        createdAt: new Date('2026-02-03T14:00:00Z'),
      },
      {
        conversationId: conv1.id,
        senderType: SenderType.AI,
        content:
          "Hi Sarah! Yes, we have the 2024 X5 in stock. Are you interested in the xDrive40i or the M50?",
        metadata: { model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
        createdAt: new Date('2026-02-03T14:05:00Z'),
      },
      {
        conversationId: conv1.id,
        senderType: SenderType.CUSTOMER,
        content: 'The M50. What colors do you have?',
        createdAt: new Date('2026-02-03T14:30:00Z'),
      },
    ],
  });
  console.log(`  Created conversation: ${conv1.customerName}`);

  // Conversation 2: Mike Rodriguez - Service appointment
  const conv2 = await prisma.conversation.upsert({
    where: { id: 'conv-mike-rodriguez' },
    update: {},
    create: {
      id: 'conv-mike-rodriguez',
      hubspotContactId: 'hs-contact-mike',
      customerName: 'Mike Rodriguez',
      customerEmail: 'mike.rodriguez@email.com',
      customerPhone: '+1-555-0202',
      status: ConversationStatus.IN_PROGRESS,
      assignedToId: admin.id,
      lastMessageAt: new Date('2026-02-03T10:15:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderType: SenderType.CUSTOMER,
        content:
          'I need to schedule service for my 330i. Check engine light came on.',
        createdAt: new Date('2026-02-03T10:00:00Z'),
      },
      {
        conversationId: conv2.id,
        senderType: SenderType.AI,
        content:
          "I'm sorry to hear that, Mike. I can help you schedule a diagnostic. What days work best for you this week?",
        metadata: { model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
        createdAt: new Date('2026-02-03T10:05:00Z'),
      },
      {
        conversationId: conv2.id,
        senderType: SenderType.CUSTOMER,
        content:
          'Thursday or Friday afternoon would work. Do you have any openings?',
        createdAt: new Date('2026-02-03T10:15:00Z'),
      },
    ],
  });
  console.log(`  Created conversation: ${conv2.customerName}`);

  // Conversation 3: Jennifer Walsh - Price comparison
  const conv3 = await prisma.conversation.upsert({
    where: { id: 'conv-jennifer-walsh' },
    update: {},
    create: {
      id: 'conv-jennifer-walsh',
      hubspotContactId: 'hs-contact-jennifer',
      customerName: 'Jennifer Walsh',
      customerEmail: 'jennifer.walsh@email.com',
      customerPhone: '+1-555-0303',
      status: ConversationStatus.NEW,
      lastMessageAt: new Date('2026-02-04T09:00:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        senderType: SenderType.CUSTOMER,
        content:
          "What's your best price on the X3? I'm also looking at the Audi Q5.",
        createdAt: new Date('2026-02-04T09:00:00Z'),
      },
    ],
  });
  console.log(`  Created conversation: ${conv3.customerName}`);

  // Conversation 4: David Kim - Resolved test drive
  const conv4 = await prisma.conversation.upsert({
    where: { id: 'conv-david-kim' },
    update: {},
    create: {
      id: 'conv-david-kim',
      hubspotContactId: 'hs-contact-david',
      customerName: 'David Kim',
      customerEmail: 'david.kim@email.com',
      customerPhone: '+1-555-0404',
      status: ConversationStatus.RESOLVED,
      assignedToId: creator.id,
      lastMessageAt: new Date('2026-02-02T16:30:00Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv4.id,
        senderType: SenderType.CUSTOMER,
        content: "I'd like to schedule a test drive for the 2024 i4 eDrive40.",
        createdAt: new Date('2026-02-02T15:00:00Z'),
      },
      {
        conversationId: conv4.id,
        senderType: SenderType.AI,
        content:
          "Great choice, David! The i4 eDrive40 is a fantastic electric sedan. I'd be happy to arrange a test drive. Would you prefer a weekday or weekend?",
        metadata: { model: 'claude-sonnet-4-20250514', provider: 'anthropic' },
        createdAt: new Date('2026-02-02T15:05:00Z'),
      },
      {
        conversationId: conv4.id,
        senderType: SenderType.CUSTOMER,
        content: 'Saturday morning would be perfect.',
        createdAt: new Date('2026-02-02T15:20:00Z'),
      },
      {
        conversationId: conv4.id,
        senderType: SenderType.AGENT,
        content:
          "You're all set for Saturday at 10 AM! Ask for me, Alex, when you arrive. We'll have the i4 ready for you.",
        createdAt: new Date('2026-02-02T16:00:00Z'),
      },
      {
        conversationId: conv4.id,
        senderType: SenderType.CUSTOMER,
        content: 'Thanks! See you Saturday.',
        createdAt: new Date('2026-02-02T16:30:00Z'),
      },
    ],
  });
  console.log(`  Created conversation: ${conv4.customerName}`);

  console.log('\nDatabase seeding completed!');
  console.log('\nTest Credentials:');
  console.log('  Admin:   admin@dealsmart.ai / Admin@123');
  console.log('  Creator: creator@dealsmart.ai / Creator@123');
  console.log('  User:    user@dealsmart.ai / User@123');
  console.log('\nSample Conversations:');
  console.log('  Sarah Chen     - BMW X5 inquiry (IN_PROGRESS)');
  console.log('  Mike Rodriguez - Service scheduling (IN_PROGRESS)');
  console.log('  Jennifer Walsh - Price comparison (NEW)');
  console.log('  David Kim      - Test drive (RESOLVED)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
