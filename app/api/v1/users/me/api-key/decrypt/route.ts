export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { safeDecrypt } from '@/lib/utils/encryption';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { userRepository } from '@/server/repositories/user.repository';

/**
 * GET /api/v1/users/me/api-key/decrypt
 * Get the decrypted API key for use in API calls.
 *
 * This endpoint returns the actual API key (decrypted) for use in
 * server-side LLM API calls. It should only be called from trusted
 * server contexts.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const user = await userRepository.findById(session.user.id);

    if (!user) {
      return errorResponse(new Error('User not found'));
    }

    if (!user.llmApiKey) {
      return successResponse({
        hasApiKey: false,
        apiKey: null,
        provider: user.llmProvider,
      });
    }

    const decryptedKey = safeDecrypt(user.llmApiKey);

    if (!decryptedKey) {
      return successResponse({
        hasApiKey: false,
        apiKey: null,
        provider: user.llmProvider,
        error: 'Failed to decrypt API key',
      });
    }

    return successResponse({
      hasApiKey: true,
      apiKey: decryptedKey,
      provider: user.llmProvider,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
