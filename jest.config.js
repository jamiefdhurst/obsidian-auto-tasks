/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'jest-environment-obsidian',
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'd.ts', 'ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'CommonJS',
        verbatimModuleSyntax: false,
      }
    }
  },
  coverageReporters: ['html', 'text', 'cobertura'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!<rootDir>/node_modules/',
  ],
};
