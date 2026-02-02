export const runtime = 'nodejs';

import { createInviteSchema } from '@/lib/schemas/invite.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAdmin } from '@/server/middleware/auth.middleware';
import { inviteService } from '@/server/services/invite.service';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/invites
 * Create a new invite code (admin only)
 *
 * Request body:
 * {
 *   "targetRole": "CREATOR",  // Optional, defaults to CREATOR
 *   "expiresAt": "2024-12-31" // Optional, ISO date
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const input = createInviteSchema.parse(body);

    const invite = await inviteService.createInvite(session.user.id, input);

    return successResponse(
      {
        message: 'Invite code created successfully',
        invite: {
          id: invite.id,
          code: invite.code,
          targetRole: invite.targetRole,
          expiresAt: invite.expiresAt,
          createdAt: invite.createdAt,
        },
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/v1/invites
 * List all invite codes (admin only)
 */
export async function GET() {
  try {
    await requireAdmin();
    const invites = await inviteService.listInvites();

    return successResponse({
      invites: invites.map((invite) => ({
        id: invite.id,
        code: invite.code,
        targetRole: invite.targetRole,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        usedBy: invite.usedBy,
        usedAt: invite.usedAt,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
