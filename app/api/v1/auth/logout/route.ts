export const runtime = 'nodejs';

import { successResponse } from '@/lib/utils/api-response';
import { cookies } from 'next/headers';

/**
 * POST /api/v1/auth/logout
 * Sign out the current user
 *
 * For JWT-based sessions, this clears the session cookie.
 * For API clients using Bearer tokens, they should discard
 * the tokens client-side.
 */
export async function POST() {
  // Clear the NextAuth session cookie
  const cookieStore = await cookies();
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');

  return successResponse({ message: 'Logout successful' });
}
