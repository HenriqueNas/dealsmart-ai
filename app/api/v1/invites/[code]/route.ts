export const runtime = 'nodejs';

import { inviteCodeSchema } from '@/lib/schemas/invite.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { inviteService } from '@/server/services/invite.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/v1/invites/[code]
 * Validate an invite code
 *
 * Returns whether the code is valid and what role it grants
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { code } = await params;

    // Validate code format
    const parseResult = inviteCodeSchema.safeParse(code);
    if (!parseResult.success) {
      return successResponse({
        valid: false,
        message: 'Invalid invite code format',
      });
    }

    const result = await inviteService.validateCode(code);

    if (!result.valid) {
      return successResponse({
        valid: false,
        message: 'Invite code is invalid, expired, or already used',
      });
    }

    return successResponse({
      valid: true,
      targetRole: result.targetRole,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
