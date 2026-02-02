import type { Role, User } from '@/infra/prisma/generated/client';
import { prisma } from '@/infra/prisma/prisma';

export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}

export interface UpdateUserData {
  name?: string;
  image?: string | null;
  role?: Role;
  verified?: boolean;
  ageVerified?: boolean;
}

class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role ?? 'USER',
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  async exists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return user !== null;
  }
}

export const userRepository = new UserRepository();
