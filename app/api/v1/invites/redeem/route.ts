export const runtime = 'nodejs';

import { redeemInviteSchema } from '@/lib/schemas/invite.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { inviteService } from '@/server/services/invite.service';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/invites/redeem
 * Redeem an invite code to upgrade user role
 *
 * Request body:
 * {
 *   "code": "DSA-XXXX-XXXX"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { code } = redeemInviteSchema.parse(body);

    const user = await inviteService.redeemCode(session.user.id, code);

    return successResponse({
      message: `Role upgraded to ${user.role}`,
      user,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
