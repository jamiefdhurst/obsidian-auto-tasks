import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'main.js',
      'coverage/**',
      '*.d.ts',
      '!src/**/*.d.ts',
      '*.config.js',
      '*.mjs',
      '!eslint.config.mjs',
      'jest-environment-obsidian.js',
    ],
  },

  // Base ESLint recommended config
  eslint.configs.recommended,

  // TypeScript files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,

        // Obsidian globals
        createDiv: false,
        createEl: false,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      'no-unused-vars': 'off',

      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',

      // General rules
      'no-prototype-builtins': 'off',
    },
  },

  // Test files can have additional relaxed rules if needed
  {
    files: ['src/**/*.test.ts', 'src/__tests__/**/*.ts', 'src/__mocks__/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
