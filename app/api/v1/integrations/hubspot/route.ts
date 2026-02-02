import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { hubspotService } from '@/server/integrations/hubspot';
import { requireAdmin } from '@/server/middleware/auth.middleware';

/**
 * GET /api/v1/integrations/hubspot
 * Get HubSpot integration status
 *
 * Returns whether HubSpot is configured and available.
 * Admin only.
 */
export async function GET() {
  try {
    await requireAdmin();

    const isAvailable = hubspotService.isAvailable();

    return successResponse({
      configured: isAvailable,
      status: isAvailable ? 'connected' : 'not_configured',
      message: isAvailable
        ? 'HubSpot integration is configured and ready'
        : 'HubSpot integration is not configured. Set HUBSPOT_ACCESS_TOKEN environment variable.',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
