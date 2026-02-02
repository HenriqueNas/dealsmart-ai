export const runtime = 'nodejs';

import { adminUpdateUserSchema } from '@/lib/schemas/user.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAdmin, requireAuth } from '@/server/middleware/auth.middleware';
import { userService } from '@/server/services/user.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/users/:id
 * Get user by ID (with RBAC)
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const user = await userService.getUser(id, session.user.id, session.user.role);

    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PATCH /api/v1/users/:id
 * Update user by ID (admin or self)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const body = await request.json();
    const input = adminUpdateUserSchema.parse(body);

    const user = await userService.updateUser(id, input, session.user.id, session.user.role);

    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/v1/users/:id
 * Delete user by ID (admin only)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await requireAdmin();

    await userService.deleteUser(id, session.user.id, session.user.role);

    return successResponse({ message: 'User deleted successfully' });
  } catch (error) {
    return errorResponse(error);
  }
}
