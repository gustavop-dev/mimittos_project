const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/__tests__/**/*.test.(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/e2e/**',
    '!app/layout.tsx',
    '!app/globals.css',
    '!lib/types.ts',
  ],
  coverageProvider: 'v8',
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 45,
      lines: 65,
      statements: 65,
    },
    './lib/stores/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './lib/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ['text-summary', 'text', 'lcov', 'html', 'json-summary'],
};

// next/jest sets its own transformIgnorePatterns; override after resolution
// so that swiper's ESM files (.mjs) are transformed by Babel/SWC.
async function jestConfig() {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    '/node_modules/(?!(swiper)/).*',
    '^.+\\.module\\.(css|sass|scss)$',
  ];
  return config;
}

module.exports = jestConfig;
