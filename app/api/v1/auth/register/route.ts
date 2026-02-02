export const runtime = 'nodejs';

import { registerSchema } from '@/lib/schemas/auth.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { authService } from '@/server/services/auth.service';
import { generateTokenPair } from '@/server/utils/jwt';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/auth/register
 * Register a new user account
 *
 * Returns user data along with JWT access and refresh tokens
 * for immediate API authentication after registration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const user = await authService.register(input);

    const tokens = await generateTokenPair(user);

    return successResponse(
      {
        message: 'Registration successful',
        user,
        ...tokens,
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}
