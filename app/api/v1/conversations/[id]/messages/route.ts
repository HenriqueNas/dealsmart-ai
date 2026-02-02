export const runtime = 'nodejs';

import {
  messagePollingQuerySchema,
  sendMessageSchema,
} from '@/lib/schemas/conversation.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { conversationService } from '@/server/services/conversation.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/conversations/:id/messages
 * Get messages for a conversation (supports polling)
 *
 * Query params:
 * - since: ISO timestamp to get messages after (for polling)
 * - limit: Max number of messages to return (default: 50, max: 100)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = messagePollingQuerySchema.parse(searchParams);

    const messages = await conversationService.getMessages(id, {
      since: query.since,
      limit: query.limit,
    });

    return successResponse({
      messages,
      pollingTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/v1/conversations/:id/messages
 * Send a message in a conversation
 *
 * Body:
 * - content: Message text (required)
 * - senderType: CUSTOMER | AGENT | AI (default: AGENT)
 * - metadata: Additional data (optional)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const input = sendMessageSchema.parse(body);

    const message = await conversationService.sendMessage({
      conversationId: id,
      content: input.content,
      senderType: input.senderType,
      metadata: input.metadata,
    });

    return successResponse(message, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
