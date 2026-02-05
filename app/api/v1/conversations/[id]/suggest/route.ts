export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { safeDecrypt } from '@/lib/utils/encryption';
import { hubspotService } from '@/server/integrations/hubspot';
import { llmService, createLlmServiceWithKey } from '@/server/integrations/llm';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { userRepository } from '@/server/repositories/user.repository';
import { conversationService } from '@/server/services/conversation.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/conversations/:id/suggest
 * Generate an AI-suggested response for a conversation
 *
 * Uses the user's stored API key if available, otherwise falls back
 * to environment-configured API keys.
 *
 * Returns:
 * - suggestion: The AI-generated response text
 * - model: The model used (e.g., "claude-3-sonnet")
 * - provider: The provider used ("anthropic" or "openai")
 * - warnings: Any validation warnings about the suggestion
 * - latencyMs: Time taken to generate the suggestion
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Get user's stored API key if available
    const user = await userRepository.findById(session.user.id);
    let userApiKey: string | null = null;
    let userProvider: 'anthropic' | 'openai' | 'google' | null = null;

    if (user?.llmApiKey) {
      userApiKey = safeDecrypt(user.llmApiKey);
      userProvider = user.llmProvider?.toLowerCase() as 'anthropic' | 'openai' | 'google';
    }

    // Determine which LLM service to use
    const effectiveLlmService = userApiKey && userProvider
      ? createLlmServiceWithKey(userApiKey, userProvider)
      : llmService;

    // Check if LLM is available
    if (!effectiveLlmService.isAvailable()) {
      return errorResponse(
        new Error(
          'AI suggestions are not available. Please configure an API key in your profile or contact your administrator.'
        )
      );
    }

    // Get conversation with messages
    const conversation =
      await conversationService.getConversationWithMessages(id);

    if (conversation.messages.length === 0) {
      return errorResponse(
        new Error('Cannot generate suggestion for empty conversation')
      );
    }

    // Get customer context from HubSpot if available
    let customerContext;
    try {
      const contact = await hubspotService.getContactById(
        conversation.hubspotContactId
      );
      if (contact) {
        customerContext = {
          name:
            `${contact.firstname || ''} ${contact.lastname || ''}`.trim() ||
            conversation.customerName,
          email: contact.email || conversation.customerEmail || undefined,
          phone: contact.phone || conversation.customerPhone || undefined,
        };
      }
    } catch (error) {
      console.warn('[Suggest] Failed to fetch HubSpot contact:', error);
      // Continue without HubSpot context
      customerContext = {
        name: conversation.customerName,
        email: conversation.customerEmail || undefined,
        phone: conversation.customerPhone || undefined,
      };
    }

    // Generate suggestion
    const result = await effectiveLlmService.generateSuggestion(
      conversation.messages,
      customerContext
    );

    // Validate the suggestion
    const validation = effectiveLlmService.validateSuggestion(result.suggestion);

    return successResponse({
      suggestion: result.suggestion,
      model: result.model,
      provider: result.provider,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      warnings: validation.warnings,
      conversationId: id,
      usingUserKey: !!userApiKey,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/v1/conversations/:id/suggest
 * Get LLM provider status
 */
export async function GET() {
  try {
    const session = await requireAuth();

    // Check if user has a stored API key
    const user = await userRepository.findById(session.user.id);
    const hasUserKey = !!user?.llmApiKey;

    const providers = llmService.getProviderStatus();
    const envAvailable = llmService.isAvailable();

    return successResponse({
      available: envAvailable || hasUserKey,
      hasUserKey,
      userProvider: user?.llmProvider,
      providers,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
