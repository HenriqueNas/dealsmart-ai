export const runtime = 'nodejs';

import { registerSchema } from '@/lib/schemas/auth.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { authService } from '@/server/services/auth.service';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const user = await authService.register(input);

    return successResponse(user, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
