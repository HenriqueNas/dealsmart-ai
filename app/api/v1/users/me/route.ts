export const runtime = 'nodejs';

import {
  deleteAccountSchema,
  updateUserSchema,
} from '@/lib/schemas/user.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { userService } from '@/server/services/user.service';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/users/me
 * Get current authenticated user profile
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const user = await userService.getCurrentUser(session.user.id);

    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PATCH /api/v1/users/me
 * Update current authenticated user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = updateUserSchema.parse(body);

    const user = await userService.updateCurrentUser(session.user.id, input);

    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/v1/users/me
 * Delete current authenticated user account
 *
 * Requires password confirmation in the request body.
 * This action is irreversible.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { password } = deleteAccountSchema.parse(body);

    await userService.deleteOwnAccount(session.user.id, password);

    return successResponse({ message: 'Account deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}
