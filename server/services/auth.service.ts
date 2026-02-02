import type { User } from '@/infra/prisma/generated/client';
import { prisma } from '@/infra/prisma/prisma';
import type { LoginInput, RegisterInput } from '@/lib/schemas/auth.schema';
import type { SafeUser } from '@/lib/types';
import { hashPassword, verifyPassword } from '@/lib/utils/password';
import { hubspotService } from '@/server/integrations/hubspot';
import { userRepository } from '@/server/repositories/user.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/server/utils/errors';
import crypto from 'crypto';

// Password reset token expiry (1 hour)
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

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

    // Sync new user to HubSpot (async, don't block registration)
    hubspotService.onUserRegistered(user).catch((err) => {
      console.error('[AuthService] Failed to sync new user to HubSpot:', err);
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

  /**
   * Generate a password reset token for a user
   * Returns success even if email doesn't exist (security best practice)
   */
  async generatePasswordResetToken(
    email: string
  ): Promise<{ success: true; message: string }> {
    const user = await userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent',
      };
    }

    // Check if user has a password (OAuth-only users can't reset password)
    const userWithPassword = user as User & { passwordHash?: string };
    if (!userWithPassword.passwordHash) {
      return {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent',
      };
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used to invalidate
      },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS);

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // TODO: Send email with reset link
    // In production, integrate with email service (SendGrid, Resend, etc.)
    // For now, log the token for development
    console.log(`[DEV] Password reset token for ${email}: ${token}`);

    return {
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent',
    };
  }

  /**
   * Reset password using a valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<SafeUser> {
    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Check if token is already used
    if (resetToken.usedAt) {
      throw new BadRequestError('Reset token has already been used');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestError('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user's password and mark token as used
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return toSafeUser(updatedUser);
  }

  /**
   * Validate a password reset token (without using it)
   */
  async validateResetToken(
    token: string
  ): Promise<{ valid: boolean; message?: string }> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { valid: false, message: 'Invalid reset token' };
    }

    if (resetToken.usedAt) {
      return { valid: false, message: 'Reset token has already been used' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true };
  }
}

export const authService = new AuthService();
