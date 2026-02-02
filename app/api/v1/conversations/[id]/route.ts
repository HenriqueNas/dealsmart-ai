export const runtime = 'nodejs';

import { updateConversationSchema } from '@/lib/schemas/conversation.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { conversationService } from '@/server/services/conversation.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/conversations/:id
 * Get a conversation with all its messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const conversation = await conversationService.getConversationWithMessages(id);

    return successResponse(conversation);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PATCH /api/v1/conversations/:id
 * Update a conversation's status or assignment
 *
 * Body:
 * - status: NEW | IN_PROGRESS | RESOLVED
 * - assignedToId: Agent ID or null to unassign
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const input = updateConversationSchema.parse(body);

    let conversation = await conversationService.getConversation(id);

    // Update status if provided
    if (input.status) {
      conversation = await conversationService.updateStatus(id, input.status);
    }

    // Update assignment if provided
    if (input.assignedToId !== undefined) {
      conversation = await conversationService.assignToAgent(
        id,
        input.assignedToId
      );
    }

    // If only updating status, also assign to current user if not already assigned
    if (
      input.status === 'IN_PROGRESS' &&
      !conversation.assignedToId &&
      !input.assignedToId
    ) {
      conversation = await conversationService.assignToAgent(
        id,
        session.user.id
      );
    }

    return successResponse(conversation);
  } catch (error) {
    return errorResponse(error);
  }
}
