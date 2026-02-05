export const runtime = 'nodejs';

import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { hubspotService } from '@/server/integrations/hubspot';
import { requireAuth } from '@/server/middleware/auth.middleware';
import { conversationService } from '@/server/services/conversation.service';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/conversations/:id/hubspot
 * Get HubSpot CRM profile data for the customer in this conversation.
 *
 * Returns the customer's HubSpot contact details including name, email,
 * phone, and lifecycle stage. Used to display the HubSpot profile card
 * in the conversation detail view.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const conversation = await conversationService.getConversation(id);

    if (!hubspotService.isAvailable()) {
      return successResponse({
        available: false,
        message: 'HubSpot integration is not configured',
      });
    }

    const contact = await hubspotService.getContactById(
      conversation.hubspotContactId
    );

    if (!contact) {
      return successResponse({
        available: true,
        found: false,
        hubspotContactId: conversation.hubspotContactId,
        message: 'Contact not found in HubSpot',
      });
    }

    return successResponse({
      available: true,
      found: true,
      contact: {
        id: contact.id,
        email: contact.email,
        firstname: contact.firstname,
        lastname: contact.lastname,
        phone: contact.phone,
        fullName: [contact.firstname, contact.lastname]
          .filter(Boolean)
          .join(' ') || undefined,
      },
      hubspotContactId: conversation.hubspotContactId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/v1/conversations/:id/hubspot
 * Refresh conversation customer data from HubSpot
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const updated = await conversationService.refreshCustomerData(id);

    return successResponse({
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      customerPhone: updated.customerPhone,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
