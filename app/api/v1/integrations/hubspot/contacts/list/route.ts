export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { safeDecrypt } from '@/lib/utils/encryption';
import { createHubSpotClientWithToken, hubspotService } from '@/server/integrations/hubspot';
import { requireRoleAtLeast } from '@/server/middleware/auth.middleware';
import { userRepository } from '@/server/repositories/user.repository';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/integrations/hubspot/contacts/list
 * List contacts from HubSpot CRM for populating the "New Conversation" dialog.
 *
 * **Access Control:** Only CREATOR and ADMIN roles can access this endpoint.
 *
 * Uses the user's stored HubSpot token if available, otherwise falls back
 * to the environment-configured token.
 *
 * Query params:
 * - limit: Number of contacts to return (default: 50, max: 100)
 * - after: Cursor for pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Only CREATOR and ADMIN roles can import contacts from HubSpot
    const session = await requireRoleAtLeast('CREATOR');

    // Get user's stored HubSpot token if available
    const user = await userRepository.findById(session.user.id);
    let userToken: string | null = null;

    if (user?.hubspotAccessToken) {
      userToken = safeDecrypt(user.hubspotAccessToken);
    }

    // Check if we have any way to connect to HubSpot
    const hasUserToken = !!userToken;
    const hasEnvToken = hubspotService.isAvailable();

    if (!hasUserToken && !hasEnvToken) {
      return successResponse({
        contacts: [],
        hasMore: false,
        configured: false,
        message: 'HubSpot integration is not configured. Please add your HubSpot access token in your profile settings.',
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
    const after = searchParams.get('after') || undefined;

    let result;

    if (userToken) {
      // Use user's token
      const userClient = createHubSpotClientWithToken(userToken);
      const response = await userClient.listContacts(limit, after);
      result = {
        contacts: response.results.map((contact) => ({
          id: contact.id,
          email: contact.properties.email,
          firstname: contact.properties.firstname,
          lastname: contact.properties.lastname,
          phone: contact.properties.phone,
        })),
        hasMore: !!response.paging?.next?.after,
        nextCursor: response.paging?.next?.after,
      };
    } else {
      // Fall back to environment token via hubspotService
      result = await hubspotService.listContacts(limit, after);
    }

    return successResponse({
      ...result,
      configured: true,
      usingUserToken: hasUserToken,
    });
  } catch (error) {
    // Handle HubSpot authentication errors with a user-friendly message
    const statusCode = (error as { code?: number })?.code;
    if (statusCode === 401) {
      return successResponse({
        contacts: [],
        hasMore: false,
        configured: false,
        message: 'HubSpot authentication failed. Please check your access token in your profile settings. Make sure you have the required scopes (crm.objects.contacts.read).',
      });
    }
    return errorResponse(error);
  }
}
