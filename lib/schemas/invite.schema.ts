import { z } from 'zod';
import { userRoleSchema } from './user.schema';

/**
 * Invite code format: DSA-XXXX-XXXX (alphanumeric, uppercase)
 * Example: DSA-AB12-CD34
 */
export const inviteCodeSchema = z
  .string()
  .regex(
    /^DSA-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    'Invalid invite code format. Expected: DSA-XXXX-XXXX'
  );

/**
 * Schema for creating a new invite code (admin only)
 */
export const createInviteSchema = z.object({
  targetRole: userRoleSchema
    .refine(
      (role) => role === 'CREATOR',
      'Currently only CREATOR invites are supported'
    )
    .default('CREATOR'),
  expiresAt: z.coerce.date().optional(),
});

/**
 * Schema for redeeming an invite code
 */
export const redeemInviteSchema = z.object({
  code: inviteCodeSchema,
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RedeemInviteInput = z.infer<typeof redeemInviteSchema>;
