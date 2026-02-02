import { resetPasswordSchema } from '@/lib/schemas/password-reset.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { authService } from '@/server/services/auth.service';
import { generateTokenPair } from '@/server/utils/jwt';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/auth/reset-password
 * Reset password using a valid reset token
 *
 * Returns user data and tokens for automatic login after reset.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    const user = await authService.resetPassword(input.token, input.password);
    const tokens = await generateTokenPair(user);

    return successResponse({
      message: 'Password reset successful',
      user,
      ...tokens,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/v1/auth/reset-password?token=xxx
 * Validate a reset token without using it
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse(new Error('Token is required'));
    }

    const result = await authService.validateResetToken(token);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
