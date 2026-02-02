export const runtime = 'nodejs';

import {
  conversationListQuerySchema,
  createConversationSchema,
} from '@/lib/schemas/conversation.schema';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { conversationService } from '@/server/services/conversation.service';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/conversations
 * List conversations with optional filters and pagination
 *
 * Query params:
 * - status: NEW | IN_PROGRESS | RESOLVED
 * - assignedToId: Filter by assigned agent
 * - search: Search by customer name or email
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = conversationListQuerySchema.parse(searchParams);

    const result = await conversationService.listConversations(
      {
        status: query.status,
        assignedToId: query.assignedToId,
        search: query.search,
      },
      {
        page: query.page,
        pageSize: query.pageSize,
      }
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/v1/conversations
 * Create a new conversation
 *
 * Body:
 * - hubspotContactId: HubSpot contact ID (required)
 * - customerName: Customer name (optional, fetched from HubSpot if not provided)
 * - customerEmail: Customer email (optional)
 * - customerPhone: Customer phone (optional)
 * - assignedToId: Agent to assign (optional)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const input = createConversationSchema.parse(body);

    const conversation = await conversationService.createConversation(input);

    return successResponse(conversation, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
