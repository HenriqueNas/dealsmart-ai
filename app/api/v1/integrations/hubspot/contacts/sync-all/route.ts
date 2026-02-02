import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { hubspotService } from '@/server/integrations/hubspot';
import { requireAdmin } from '@/server/middleware/auth.middleware';

/**
 * POST /api/v1/integrations/hubspot/contacts/sync-all
 * Sync all users to HubSpot
 *
 * Admin only. Syncs all users in the database to HubSpot as contacts.
 * Use with caution on large user bases - consider background processing.
 */
export async function POST() {
  try {
    await requireAdmin();

    if (!hubspotService.isAvailable()) {
      return successResponse({
        success: false,
        message: 'HubSpot integration is not configured',
      });
    }

    const result = await hubspotService.syncAllUsers();

    return successResponse({
      success: true,
      message: `Synced ${result.created + result.updated} users to HubSpot`,
      ...result,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
