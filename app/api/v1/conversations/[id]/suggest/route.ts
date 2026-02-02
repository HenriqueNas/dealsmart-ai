export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { hubspotService } from '@/server/integrations/hubspot';
import { llmService } from '@/server/integrations/llm';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { conversationService } from '@/server/services/conversation.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/conversations/:id/suggest
 * Generate an AI-suggested response for a conversation
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
    await requireAuth();
    const { id } = await params;

    // Check if LLM is available
    if (!llmService.isAvailable()) {
      return errorResponse(
        new Error(
          'AI suggestions are not available. Please configure ANTHROPIC_API_KEY or OPENAI_API_KEY.'
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
    const result = await llmService.generateSuggestion(
      conversation.messages,
      customerContext
    );

    // Validate the suggestion
    const validation = llmService.validateSuggestion(result.suggestion);

    return successResponse({
      suggestion: result.suggestion,
      model: result.model,
      provider: result.provider,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      warnings: validation.warnings,
      conversationId: id,
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
    await requireAuth();

    const providers = llmService.getProviderStatus();
    const available = llmService.isAvailable();

    return successResponse({
      available,
      providers,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
