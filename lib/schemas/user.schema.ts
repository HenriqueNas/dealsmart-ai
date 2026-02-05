import { z } from 'zod';

/**
 * User role enum matching Prisma schema
 */
export const userRoleSchema = z.enum(['USER', 'CREATOR', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * LLM provider enum matching Prisma schema
 */
export const llmProviderSchema = z.enum(['ANTHROPIC', 'OPENAI', 'GOOGLE']);
export type LLMProvider = z.infer<typeof llmProviderSchema>;

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

/**
 * Delete own account schema (requires password confirmation)
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/**
 * Update LLM API key schema
 */
export const updateApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required').optional().nullable(),
  provider: llmProviderSchema.optional(),
});

export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
