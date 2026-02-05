/**
 * Simple encryption utilities for storing sensitive data like API keys.
 *
 * Uses AES-256-GCM encryption with a secret key from environment variables.
 * The encrypted format is: iv:authTag:encryptedData (all base64 encoded)
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variables.
 * Falls back to JWT_ACCESS_SECRET if ENCRYPTION_KEY is not set.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET;
  if (!key) {
    throw new Error('ENCRYPTION_KEY or JWT_ACCESS_SECRET environment variable is required');
  }
  // Hash the key to ensure it's exactly 32 bytes for AES-256
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string value.
 * Returns the encrypted value in format: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value.
 * Expects input in format: iv:authTag:encryptedData
 */
export function decrypt(encryptedValue: string): string {
  const key = getEncryptionKey();

  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }

  const [ivBase64, authTagBase64, encrypted] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Safely decrypt a value, returning null if decryption fails.
 */
export function safeDecrypt(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue) return null;
  try {
    return decrypt(encryptedValue);
  } catch {
    console.warn('[Encryption] Failed to decrypt value');
    return null;
  }
}

/**
 * Mask an API key for display purposes.
 * Shows only the first 4 and last 4 characters.
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return '*'.repeat(apiKey.length);
  }
  const start = apiKey.slice(0, 4);
  const end = apiKey.slice(-4);
  const middle = '*'.repeat(Math.min(apiKey.length - 8, 20));
  return `${start}${middle}${end}`;
}
