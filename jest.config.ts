import type { Config } from 'jest';
import nextJest from 'next/jest.js';

import dotenv from 'dotenv';

dotenv.config({ path: ['.env', '.env.local'] });

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@v1/(.*)$': '<rootDir>/app/api/v1/$1',
    '^@infra/(.*)$': '<rootDir>/infra/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
  },
  // Transform Prisma generated ESM files
  transformIgnorePatterns: ['/node_modules/(?!(@prisma/client)/)'],
};

module.exports = createJestConfig(config);
