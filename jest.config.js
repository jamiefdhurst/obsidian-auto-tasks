/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['./src/__tests__/setup.ts'],
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['js', 'd.ts', 'ts'],
  coverageReporters: ['html', 'text', 'cobertura'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/__tests__/**',
    '!<rootDir>/node_modules/',
  ],
};
