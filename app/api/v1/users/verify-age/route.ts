export const runtime = 'nodejs';

import { ageVerificationSchema } from '@/lib/schemas/auth.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { authService } from '@/server/services/auth.service';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/users/verify-age
 * Verify user's age based on birth date
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = ageVerificationSchema.parse(body);

    const result = await authService.verifyAge(session.user.id, input.birthDate);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
