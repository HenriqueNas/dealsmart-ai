export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { hubspotService } from '@/server/integrations/hubspot';
import { requireRoleAtLeast } from '@/server/middleware/auth.middleware';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/integrations/hubspot/contacts/list
 * List contacts from HubSpot CRM for populating the "New Conversation" dialog.
 *
 * **Access Control:** Only CREATOR and ADMIN roles can access this endpoint.
 *
 * Query params:
 * - limit: Number of contacts to return (default: 50, max: 100)
 * - after: Cursor for pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Only CREATOR and ADMIN roles can import contacts from HubSpot
    await requireRoleAtLeast('CREATOR');

    if (!hubspotService.isAvailable()) {
      return successResponse({
        contacts: [],
        hasMore: false,
        configured: false,
        message: 'HubSpot integration is not configured',
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const after = searchParams.get('after') || undefined;

    const result = await hubspotService.listContacts(limit, after);

    return successResponse({
      ...result,
      configured: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
