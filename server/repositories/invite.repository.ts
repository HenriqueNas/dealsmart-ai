import type { InviteCode, Role } from '@/infra/prisma/generated/client';
import { prisma } from '@/infra/prisma/prisma';

export interface CreateInviteData {
  code: string;
  targetRole: Role;
  createdBy: string;
  expiresAt?: Date;
}

export interface UpdateInviteData {
  usedBy?: string;
  usedAt?: Date;
}

class InviteRepository {
  async findByCode(code: string): Promise<InviteCode | null> {
    return prisma.inviteCode.findUnique({
      where: { code },
    });
  }

  async findById(id: string): Promise<InviteCode | null> {
    return prisma.inviteCode.findUnique({
      where: { id },
    });
  }

  async findByCreator(createdBy: string): Promise<InviteCode[]> {
    return prisma.inviteCode.findMany({
      where: { createdBy },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(): Promise<InviteCode[]> {
    return prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateInviteData): Promise<InviteCode> {
    return prisma.inviteCode.create({
      data: {
        code: data.code,
        targetRole: data.targetRole,
        createdBy: data.createdBy,
        expiresAt: data.expiresAt,
      },
    });
  }

  async update(id: string, data: UpdateInviteData): Promise<InviteCode> {
    return prisma.inviteCode.update({
      where: { id },
      data,
    });
  }

  async markAsUsed(id: string, userId: string): Promise<InviteCode> {
    return prisma.inviteCode.update({
      where: { id },
      data: {
        usedBy: userId,
        usedAt: new Date(),
      },
    });
  }

  async delete(id: string): Promise<InviteCode> {
    return prisma.inviteCode.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const invite = await prisma.inviteCode.findUnique({
      where: { code },
      select: { id: true },
    });
    return invite !== null;
  }
}

export const inviteRepository = new InviteRepository();
