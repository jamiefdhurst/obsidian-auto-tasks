/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.svelte$': [
      'svelte-jester', {
        preprocess: true,
      },
    ],
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'svelte', 'd.ts', 'ts'],
  globals: {
    'ts-jest': {
      tsConfig: {
        module: 'CommonJS',
        verbatimModuleSyntax: false,
      }
    }
  },
  coverageReporters: ['html', 'text', 'cobertura'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,svelte,ts,tsx}',
    '!<rootDir>/node_modules/',
  ],
};
