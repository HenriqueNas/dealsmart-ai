export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { encrypt, maskApiKey, safeDecrypt } from '@/lib/utils/encryption';
import { requireRoleAtLeast } from '@/server/middleware/auth.middleware';
import { userRepository } from '@/server/repositories/user.repository';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const updateHubSpotTokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required').optional().nullable(),
});

/**
 * GET /api/v1/users/me/hubspot-token
 * Get current user's HubSpot access token configuration (masked)
 *
 * **Access Control:** Only CREATOR and ADMIN roles can access this endpoint.
 */
export async function GET() {
  try {
    const session = await requireRoleAtLeast('CREATOR');
    const user = await userRepository.findById(session.user.id);

    if (!user) {
      return errorResponse(new Error('User not found'));
    }

    const hasToken = !!user.hubspotAccessToken;
    let maskedToken: string | null = null;

    if (hasToken && user.hubspotAccessToken) {
      const decrypted = safeDecrypt(user.hubspotAccessToken);
      if (decrypted) {
        maskedToken = maskApiKey(decrypted);
      }
    }

    return successResponse({
      hasToken,
      maskedToken,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/v1/users/me/hubspot-token
 * Update current user's HubSpot access token
 *
 * **Access Control:** Only CREATOR and ADMIN roles can access this endpoint.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireRoleAtLeast('CREATOR');
    const body = await request.json();
    const input = updateHubSpotTokenSchema.parse(body);

    let encryptedToken: string | null = null;

    if (input.accessToken !== undefined && input.accessToken !== null && input.accessToken !== '') {
      encryptedToken = encrypt(input.accessToken);
    }

    const user = await userRepository.update(session.user.id, {
      hubspotAccessToken: encryptedToken,
    });

    const hasToken = !!user.hubspotAccessToken;
    let maskedToken: string | null = null;

    if (hasToken && user.hubspotAccessToken) {
      const decrypted = safeDecrypt(user.hubspotAccessToken);
      if (decrypted) {
        maskedToken = maskApiKey(decrypted);
      }
    }

    return successResponse({
      hasToken,
      maskedToken,
      message: input.accessToken ? 'HubSpot token saved' : 'HubSpot token removed',
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/v1/users/me/hubspot-token
 * Remove current user's HubSpot access token
 *
 * **Access Control:** Only CREATOR and ADMIN roles can access this endpoint.
 */
export async function DELETE() {
  try {
    const session = await requireRoleAtLeast('CREATOR');

    await userRepository.update(session.user.id, {
      hubspotAccessToken: null,
    });

    return successResponse({
      hasToken: false,
      maskedToken: null,
      message: 'HubSpot token removed',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
