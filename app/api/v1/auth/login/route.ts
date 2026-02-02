import { loginSchema } from '@/lib/schemas/auth.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { authService } from '@/server/services/auth.service';
import { generateTokenPair } from '@/server/utils/jwt';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/auth/login
 * Authenticate user with email and password
 *
 * Returns user data along with JWT access and refresh tokens
 * for API authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    // Validate credentials and get user data
    const user = await authService.validateCredentials(input);
    const tokens = await generateTokenPair(user);

    return successResponse({
      message: 'Login successful',
      user,
      ...tokens,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
