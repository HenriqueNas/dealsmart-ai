import { forgotPasswordSchema } from '@/lib/schemas/password-reset.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { authService } from '@/server/services/auth.service';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset email
 *
 * Always returns success to prevent email enumeration attacks.
 * If the email exists and has a password, a reset token is generated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = forgotPasswordSchema.parse(body);

    const result = await authService.generatePasswordResetToken(input.email);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
