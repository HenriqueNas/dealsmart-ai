import type { User } from '@/infra/prisma/generated/client';
import type {
  AdminUpdateUserInput,
  UpdateUserInput,
  UserRole,
} from '@/lib/schemas/user.schema';
import type { SafeUser } from '@/lib/types';
import { verifyPassword } from '@/lib/utils/password';
import { hubspotService } from '@/server/integrations/hubspot';
import { userRepository } from '@/server/repositories/user.repository';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/server/utils/errors';

/**
 * Remove sensitive fields from user object
 */
function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safeUser } = user as User & {
    passwordHash?: string;
  };
  return safeUser;
}

class UserService {
  /**
   * Get user by ID (internal use)
   */
  async getById(id: string): Promise<SafeUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return toSafeUser(user);
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(userId: string): Promise<SafeUser> {
    return this.getById(userId);
  }

  /**
   * Update current authenticated user (self-service)
   */
  async updateCurrentUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<SafeUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const updatedUser = await userRepository.update(userId, input);

    // Sync changes to HubSpot (async, don't block response)
    hubspotService.onUserUpdated(userId, { name: input.name }).catch((err) => {
      console.error('[UserService] Failed to sync user update to HubSpot:', err);
    });

    return toSafeUser(updatedUser);
  }

  /**
   * Get user by ID (with RBAC)
   * - Users can view their own profile
   * - Admins can view any profile
   */
  async getUser(
    id: string,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<SafeUser> {
    // Users can only view their own profile unless they're admin
    if (id !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('You can only view your own profile');
    }

    return this.getById(id);
  }

  /**
   * Update user by ID (admin or self)
   */
  async updateUser(
    id: string,
    input: AdminUpdateUserInput,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<SafeUser> {
    // Only admins can update other users
    if (id !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Non-admins cannot change roles or verification status
    if (requesterRole !== 'ADMIN') {
      const {
        role: _role,
        verified: _verified,
        ageVerified: _ageVerified,
        ...allowedUpdates
      } = input;
      const user = await userRepository.update(id, allowedUpdates);
      return toSafeUser(user);
    }

    const user = await userRepository.update(id, input);

    // Sync changes to HubSpot (async, don't block response)
    hubspotService
      .onUserUpdated(id, {
        name: input.name,
        role: input.role,
        verified: input.verified,
        ageVerified: input.ageVerified,
      })
      .catch((err) => {
        console.error('[UserService] Failed to sync admin update to HubSpot:', err);
      });

    return toSafeUser(user);
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(
    id: string,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<void> {
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenError('Only admins can delete users');
    }

    // Prevent self-deletion via admin route
    if (id === requesterId) {
      throw new ForbiddenError(
        'Use DELETE /api/v1/users/me to delete your own account'
      );
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    // Delete from HubSpot first (async, don't block)
    hubspotService.onUserDeleted(id).catch((err) => {
      console.error('[UserService] Failed to delete user from HubSpot:', err);
    });

    await userRepository.delete(id);
  }

  /**
   * Delete own account (self-service with password confirmation)
   */
  async deleteOwnAccount(userId: string, password: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verify password before deletion
    const userWithPassword = user as User & { passwordHash?: string };
    if (!userWithPassword.passwordHash) {
      throw new ForbiddenError(
        'Cannot delete account created via OAuth. Please contact support.'
      );
    }

    const isValid = await verifyPassword(password, userWithPassword.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid password');
    }

    // Delete from HubSpot first (async, don't block)
    hubspotService.onUserDeleted(userId).catch((err) => {
      console.error('[UserService] Failed to delete user from HubSpot:', err);
    });

    // Delete the user (cascade will handle related records)
    await userRepository.delete(userId);
  }
}

export const userService = new UserService();
