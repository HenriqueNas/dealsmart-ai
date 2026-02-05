export const runtime = 'nodejs';

import { updateApiKeySchema } from '@/lib/schemas/user.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { encrypt, maskApiKey, safeDecrypt } from '@/lib/utils/encryption';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { userRepository } from '@/server/repositories/user.repository';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/users/me/api-key
 * Get current user's LLM API key configuration (masked)
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const user = await userRepository.findById(session.user.id);

    if (!user) {
      return errorResponse(new Error('User not found'));
    }

    const hasApiKey = !!user.llmApiKey;
    let maskedKey: string | null = null;

    if (hasApiKey && user.llmApiKey) {
      const decrypted = safeDecrypt(user.llmApiKey);
      if (decrypted) {
        maskedKey = maskApiKey(decrypted);
      }
    }

    return successResponse({
      hasApiKey,
      maskedApiKey: maskedKey,
      provider: user.llmProvider,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/v1/users/me/api-key
 * Update current user's LLM API key configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = updateApiKeySchema.parse(body);

    const updateData: { llmApiKey?: string | null; llmProvider?: 'ANTHROPIC' | 'OPENAI' | 'GOOGLE' } = {};

    // Handle API key update
    if (input.apiKey !== undefined) {
      if (input.apiKey === null || input.apiKey === '') {
        // Clear the API key
        updateData.llmApiKey = null;
      } else {
        // Encrypt and store the new API key
        updateData.llmApiKey = encrypt(input.apiKey);
      }
    }

    // Handle provider update
    if (input.provider !== undefined) {
      updateData.llmProvider = input.provider;
    }

    const user = await userRepository.update(session.user.id, updateData);

    const hasApiKey = !!user.llmApiKey;
    let maskedKey: string | null = null;

    if (hasApiKey && user.llmApiKey) {
      const decrypted = safeDecrypt(user.llmApiKey);
      if (decrypted) {
        maskedKey = maskApiKey(decrypted);
      }
    }

    return successResponse({
      hasApiKey,
      maskedApiKey: maskedKey,
      provider: user.llmProvider,
      message: input.apiKey === null ? 'API key removed' : 'API key updated',
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/v1/users/me/api-key
 * Remove current user's LLM API key
 */
export async function DELETE() {
  try {
    const session = await requireAuth();

    await userRepository.update(session.user.id, {
      llmApiKey: null,
    });

    return successResponse({
      hasApiKey: false,
      maskedApiKey: null,
      message: 'API key removed',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
