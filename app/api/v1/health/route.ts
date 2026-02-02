import { prisma } from '@/infra/prisma/prisma';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

/**
 * GET /api/v1/health
 * Health check endpoint for monitoring and deployment verification
 */
export async function GET() {
  try {
    // Check database connectivity
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    return successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
      },
      version: '1.0.0',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
