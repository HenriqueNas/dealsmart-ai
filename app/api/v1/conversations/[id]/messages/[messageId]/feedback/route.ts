export const runtime = 'nodejs';

import { suggestionFeedbackSchema } from '@/lib/schemas/conversation.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { conversationRepository } from '@/server/repositories/conversation.repository';
import { conversationService } from '@/server/services/conversation.service';
import { BadRequestError, NotFoundError } from '@/server/utils/errors';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string; messageId: string }>;
}

/**
 * POST /api/v1/conversations/:id/messages/:messageId/feedback
 * Provide feedback on an AI-suggested message
 *
 * Body:
 * - accepted: Whether the suggestion was used (true/false)
 * - editedContent: If edited before sending, the final content
 * - reason: Optional reason for rejection
 *
 * This endpoint is used to track AI suggestion acceptance rates
 * and improve the AI over time.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id, messageId } = await params;

    const body = await request.json();
    const input = suggestionFeedbackSchema.parse(body);

    // Verify conversation exists
    await conversationService.getConversation(id);

    // Get the message
    const message = await conversationRepository.getMessageById(messageId);
    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    // Verify message belongs to this conversation
    if (message.conversationId !== id) {
      throw new BadRequestError('Message does not belong to this conversation');
    }

    // Verify this is an AI message
    if (message.senderType !== 'AI') {
      throw new BadRequestError('Feedback can only be provided for AI messages');
    }

    // Update message metadata with feedback
    const existingMetadata = (message.metadata as Record<string, unknown>) || {};
    const updatedMessage = await conversationRepository.updateMessageMetadata(
      messageId,
      {
        ...existingMetadata,
        feedback: {
          accepted: input.accepted,
          editedContent: input.editedContent,
          reason: input.reason,
          providedBy: session.user.id,
          providedAt: new Date().toISOString(),
        },
      }
    );

    // If accepted (with or without edits), send the message as agent
    if (input.accepted) {
      const contentToSend = input.editedContent || message.content;

      await conversationService.sendMessage({
        conversationId: id,
        content: contentToSend,
        senderType: 'AGENT',
        metadata: {
          basedOnAiSuggestion: messageId,
          wasEdited: !!input.editedContent,
        },
      });
    }

    return successResponse({
      message: updatedMessage,
      feedbackRecorded: true,
      messageSent: input.accepted,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
