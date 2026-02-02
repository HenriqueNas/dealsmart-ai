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
 * Role hierarchy for permission escalation
 * Higher numbers have more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  CREATOR: 2,
  ADMIN: 3,
};

/**
 * Check if a user role has at least the required role level
 * Using role hierarchy (ADMIN > CREATOR > USER)
 */
export function hasRoleAtLeast(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
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

/**
 * Options for requireOwnership middleware
 */
export interface RequireOwnershipOptions {
  /** Allow admin users to bypass ownership check (default: true) */
  allowAdmin?: boolean;
}

/**
 * Require ownership of a resource
 * Verifies that the authenticated user owns the resource
 *
 * @param resourceUserId - The user ID of the resource owner
 * @param options - Configuration options
 * @returns The authenticated session
 * @throws ForbiddenError if user doesn't own the resource
 *
 * @example
 * // In a route handler:
 * const post = await postRepository.findById(postId);
 * const session = await requireOwnership(post.userId);
 */
export async function requireOwnership(
  resourceUserId: string,
  options: RequireOwnershipOptions = {}
): Promise<AuthSession> {
  const { allowAdmin = true } = options;
  const session = await requireAuth();

  // Admin bypass if allowed
  if (allowAdmin && session.user.role === 'ADMIN') {
    return session;
  }

  // Check ownership
  if (session.user.id !== resourceUserId) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }

  return session;
}

/**
 * Require role with hierarchy support
 * Allows higher roles to access lower role resources
 *
 * @example
 * // ADMIN can access CREATOR routes
 * await requireRoleAtLeast('CREATOR');
 */
export async function requireRoleAtLeast(
  minimumRole: UserRole
): Promise<AuthSession> {
  const session = await requireAuth();

  if (!hasRoleAtLeast(session.user.role, minimumRole)) {
    throw new ForbiddenError(
      `This action requires at least ${minimumRole} role`
    );
  }

  return session;
}
