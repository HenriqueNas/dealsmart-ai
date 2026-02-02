import type { User } from '@/infra/prisma/generated/client';
import type { LoginInput, RegisterInput } from '@/lib/schemas/auth.schema';
import type { SafeUser } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import { userRepository } from '@/server/repositories/user.repository';
import {
  ConflictError,
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

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<SafeUser> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    return toSafeUser(user);
  }

  /**
   * Validate user credentials for login
   */
  async validateCredentials(input: LoginInput): Promise<SafeUser> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user has a password (might be OAuth-only user)
    const userWithPassword = user as User & { passwordHash?: string };
    if (!userWithPassword.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await verifyPassword(
      input.password,
      userWithPassword.passwordHash
    );
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return toSafeUser(user);
  }

  /**
   * Verify user age
   */
  async verifyAge(
    userId: string,
    birthDate: Date
  ): Promise<{ ageVerified: boolean }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Calculate age
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge = age - 1;
    }

    const ageVerified = actualAge >= 18;

    // Update user's age verification status
    await userRepository.update(userId, { ageVerified });

    return { ageVerified };
  }
}

export const authService = new AuthService();
