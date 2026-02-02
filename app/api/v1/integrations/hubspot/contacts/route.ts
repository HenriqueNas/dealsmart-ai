import { prisma } from '@/infra/prisma/prisma';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { hubspotService } from '@/server/integrations/hubspot';
import { requireAdmin, requireAuth } from '@/server/middleware/auth.middleware';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const syncUserSchema = z.object({
  userId: z.string().optional(),
});

/**
 * POST /api/v1/integrations/hubspot/contacts
 * Sync a user to HubSpot as a contact
 *
 * - If userId is provided (admin only), sync that specific user
 * - If no userId, sync the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const input = syncUserSchema.parse(body);

    let targetUserId = session.user.id;

    // If userId is provided, require admin role
    if (input.userId && input.userId !== session.user.id) {
      await requireAdmin();
      targetUserId = input.userId;
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return errorResponse(new Error('User not found'));
    }

    const result = await hubspotService.syncUserToContact({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      ageVerified: user.ageVerified,
    });

    return successResponse({
      ...result,
      message:
        result.action === 'created'
          ? 'Contact created in HubSpot'
          : result.action === 'updated'
            ? 'Contact updated in HubSpot'
            : result.message || 'Sync skipped',
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * GET /api/v1/integrations/hubspot/contacts
 * Get HubSpot contact info for the authenticated user
 */
export async function GET() {
  try {
    const session = await requireAuth();

    const contact = await hubspotService.getContactForUser(session.user.id);

    if (!contact) {
      return successResponse({
        synced: false,
        message: 'User is not synced to HubSpot',
      });
    }

    return successResponse({
      synced: true,
      contact: {
        id: contact.id,
        email: contact.properties.email,
        firstname: contact.properties.firstname,
        lastname: contact.properties.lastname,
        lifecyclestage: contact.properties.lifecyclestage,
        createdAt: contact.properties.createdate,
        updatedAt: contact.properties.lastmodifieddate,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
