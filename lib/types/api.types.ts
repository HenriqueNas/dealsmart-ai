import type { User } from '@/infra/prisma/generated/client';

/**
 * Safe user type without sensitive fields like passwordHash
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Session user for JWT token
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'USER' | 'CREATOR' | 'ADMIN';
  verified: boolean;
  ageVerified: boolean;
}

/**
 * Extended session with user data
 */
export interface AuthSession {
  user: SessionUser;
  expires: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
