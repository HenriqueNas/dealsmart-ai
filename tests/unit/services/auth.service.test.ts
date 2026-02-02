/**
 * Auth Service Unit Tests
 */

import { hashPassword, verifyPassword } from '@/lib/utils/password';

describe('Password Utilities', () => {
  const testPassword = 'Test@123';

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });
});
