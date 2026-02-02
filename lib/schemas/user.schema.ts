import { z } from 'zod';

/**
 * User role enum matching Prisma schema
 */
export const userRoleSchema = z.enum(['USER', 'CREATOR', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Update current user schema (self-service)
 */
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Admin update user schema (includes role management)
 */
export const adminUpdateUserSchema = updateUserSchema.extend({
  role: userRoleSchema.optional(),
  verified: z.boolean().optional(),
  ageVerified: z.boolean().optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
