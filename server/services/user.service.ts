import type { User } from '@/infra/prisma/generated/client';
import type {
  AdminUpdateUserInput,
  UpdateUserInput,
  UserRole,
} from '@/lib/schemas/user.schema';
import type { SafeUser } from '@/lib/types';
import { userRepository } from '@/server/repositories/user.repository';
import { ForbiddenError, NotFoundError } from '@/server/utils/errors';

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

    // Prevent self-deletion
    if (id === requesterId) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    await userRepository.delete(id);
  }
}

export const userService = new UserService();
