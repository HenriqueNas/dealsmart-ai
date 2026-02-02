import type { InviteCode, Role } from '@/infra/prisma/generated/client';
import type { CreateInviteInput } from '@/lib/schemas/invite.schema';
import type { SafeUser } from '@/lib/types';
import { inviteRepository } from '@/server/repositories/invite.repository';
import { userRepository } from '@/server/repositories/user.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@/server/utils/errors';

/**
 * Generate a unique invite code in format: DSA-XXXX-XXXX
 * Uses characters that are easy to read (no 0/O, 1/I/l confusion)
 */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  return `DSA-${segment()}-${segment()}`;
}

/**
 * Remove sensitive fields from user object
 */
function toSafeUser(user: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  verified: boolean;
  ageVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordHash?: string | null;
}): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser as SafeUser;
}

class InviteService {
  /**
   * Create a new invite code (admin only)
   */
  async createInvite(
    adminId: string,
    input: CreateInviteInput
  ): Promise<InviteCode> {
    // Generate a unique code
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique
    while (await inviteRepository.existsByCode(code)) {
      code = generateCode();
      attempts++;
      if (attempts >= maxAttempts) {
        throw new BadRequestError(
          'Failed to generate unique invite code. Please try again.'
        );
      }
    }

    return inviteRepository.create({
      code,
      targetRole: input.targetRole as Role,
      createdBy: adminId,
      expiresAt: input.expiresAt,
    });
  }

  /**
   * Validate an invite code
   * Returns validity status and target role if valid
   */
  async validateCode(
    code: string
  ): Promise<{ valid: boolean; targetRole?: Role; expiresAt?: Date | null }> {
    const invite = await inviteRepository.findByCode(code);

    if (!invite) {
      return { valid: false };
    }

    // Check if already used
    if (invite.usedBy) {
      return { valid: false };
    }

    // Check if expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return { valid: false };
    }

    return {
      valid: true,
      targetRole: invite.targetRole,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Redeem an invite code to upgrade user role
   */
  async redeemCode(userId: string, code: string): Promise<SafeUser> {
    const invite = await inviteRepository.findByCode(code);

    if (!invite) {
      throw new NotFoundError('InviteCode', code);
    }

    // Check if already used
    if (invite.usedBy) {
      throw new BadRequestError('This invite code has already been used');
    }

    // Check if expired
    if (invite.expiresAt && new Date() > invite.expiresAt) {
      throw new BadRequestError('This invite code has expired');
    }

    // Get user and verify they can use this invite
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Check if user already has equal or higher role
    const roleHierarchy: Record<Role, number> = {
      USER: 1,
      CREATOR: 2,
      ADMIN: 3,
    };

    if (roleHierarchy[user.role] >= roleHierarchy[invite.targetRole]) {
      throw new ForbiddenError(
        `You already have ${user.role} role which is equal or higher than ${invite.targetRole}`
      );
    }

    // Mark invite as used
    await inviteRepository.markAsUsed(invite.id, userId);

    // Update user role
    const updatedUser = await userRepository.update(userId, {
      role: invite.targetRole,
    });

    return toSafeUser(updatedUser);
  }

  /**
   * List all invites (admin only)
   */
  async listInvites(): Promise<InviteCode[]> {
    return inviteRepository.findAll();
  }

  /**
   * Get invite by code
   */
  async getByCode(code: string): Promise<InviteCode | null> {
    return inviteRepository.findByCode(code);
  }

  /**
   * Delete an invite (admin only)
   */
  async deleteInvite(id: string): Promise<void> {
    const invite = await inviteRepository.findById(id);
    if (!invite) {
      throw new NotFoundError('InviteCode', id);
    }
    await inviteRepository.delete(id);
  }
}

export const inviteService = new InviteService();
