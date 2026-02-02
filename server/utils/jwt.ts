/**
 * JWT Token Utilities
 *
 * Provides functions for generating and verifying JWT tokens
 * for API authentication.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { SafeUser } from '@/lib/types';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Access token expiry in seconds (for response)
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900 seconds

/**
 * JWT Payload for access tokens
 */
export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  verified: boolean;
  ageVerified: boolean;
}

/**
 * JWT Payload for refresh tokens
 */
export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  type: 'refresh';
}

/**
 * Get the secret key as Uint8Array for jose
 */
function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate an access token for a user
 */
export async function generateAccessToken(user: SafeUser): Promise<string> {
  const payload: Omit<AccessTokenPayload, keyof JWTPayload> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    verified: user.verified,
    ageVerified: user.ageVerified,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setSubject(user.id)
    .sign(getAccessSecret());

  return token;
}

/**
 * Generate a refresh token for a user
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const payload: Omit<RefreshTokenPayload, keyof JWTPayload> = {
    userId,
    type: 'refresh',
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setSubject(userId)
    .sign(getRefreshSecret());

  return token;
}

/**
 * Verify and decode an access token
 * Returns the payload if valid, null if invalid
 */
export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify and decode a refresh token
 * Returns the payload if valid, null if invalid
 */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    if ((payload as RefreshTokenPayload).type !== 'refresh') {
      return null;
    }
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generate both access and refresh tokens for a user
 */
export async function generateTokenPair(
  user: SafeUser
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user.id),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
}
