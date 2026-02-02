export const runtime = 'nodejs';

import { signOut } from '@/app/api/auth/[...nextauth]/auth';
import { errorResponse, successResponse } from '@/lib/utils/api-response';

/**
 * POST /api/v1/auth/logout
 * Sign out the current user
 */
export async function POST() {
  try {
    await signOut({ redirect: false });

    return successResponse({ message: 'Logout successful' });
  } catch (error) {
    return errorResponse(error);
  }
}
