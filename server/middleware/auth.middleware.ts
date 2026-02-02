import { auth } from '@/app/api/auth/[...nextauth]/auth';
import type { UserRole } from '@/lib/schemas/user.schema';
import { ForbiddenError, UnauthorizedError } from '@/server/utils/errors';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    verified: boolean;
    ageVerified: boolean;
  };
  expires: string;
}

/**
 * Require authentication
 * Throws UnauthorizedError if not authenticated
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  return session as AuthSession;
}

/**
 * Require specific role(s)
 * Throws ForbiddenError if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<AuthSession> {
  const session = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError(`This action requires one of the following roles: ${roles.join(', ')}`);
  }

  return session;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AuthSession> {
  return requireRole('ADMIN');
}

/**
 * Require age verification
 * Throws ForbiddenError if user hasn't verified their age
 */
export async function requireAgeVerification(): Promise<AuthSession> {
  const session = await requireAuth();

  if (!session.user.ageVerified) {
    throw new ForbiddenError('Age verification required');
  }

  return session;
}

/**
 * Get optional session (doesn't throw if not authenticated)
 */
export async function getOptionalSession(): Promise<AuthSession | null> {
  const session = await auth();
  return session as AuthSession | null;
}
