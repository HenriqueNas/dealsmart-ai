import { refreshTokenSchema } from '@/lib/schemas/password-reset.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { userRepository } from '@/server/repositories/user.repository';
import { UnauthorizedError } from '@/server/utils/errors';
import {
  generateAccessToken,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  verifyRefreshToken,
} from '@/server/utils/jwt';
import { NextRequest } from 'next/server';

/**
 * POST /api/v1/auth/refresh
 * Refresh an access token using a valid refresh token
 *
 * Returns a new access token without requiring re-authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = refreshTokenSchema.parse(body);

    // Verify the refresh token
    const payload = await verifyRefreshToken(input.refreshToken);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Get the user to ensure they still exist and get current data
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate a new access token with current user data
    // Extract passwordHash to create SafeUser
    const { passwordHash: _passwordHash, ...safeUser } = user as typeof user & {
      passwordHash?: string;
    };

    const accessToken = await generateAccessToken(safeUser);

    return successResponse({
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
