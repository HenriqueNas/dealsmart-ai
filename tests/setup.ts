/**
 * Jest Test Setup
 *
 * This file runs before all tests to configure the test environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-characters-long';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Database connection for tests (uses same local dev database)
process.env.POSTGRES_USER = process.env.POSTGRES_USER || 'local_user';
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'local_password';
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
process.env.POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
process.env.POSTGRES_DB = process.env.POSTGRES_DB || 'local_db';

// Extend Jest timeout for integration tests
jest.setTimeout(30000);

// Global beforeAll/afterAll hooks can be added here if needed
beforeAll(async () => {
  // Setup that runs once before all tests
});

afterAll(async () => {
  // Cleanup that runs once after all tests
});
