import eslint from '@eslint/js';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'main.js',
      'coverage/**',
      '*.config.js',
      '*.mjs',
      '!eslint.config.mjs',
    ],
  },

  // Base ESLint recommended config
  eslint.configs.recommended,

  // Obsidian community directory guidelines - these are the same rules the
  // plugin directory runs when it scores the plugin, so keep them clean
  ...obsidianmd.configs.recommended,

  // TypeScript files
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,

        // Obsidian globals
        createDiv: false,
        createEl: false,
      },
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

      // "Periodic Notes", "Auto Tasks", "Tasks" and "Kanban" are plugin names,
      // so the sentence-case rule wrongly lowercases them. The directory scan
      // does not run this rule
      'obsidianmd/ui/sentence-case': 'off',
    },
  },

  // Tests and mocks are not shipped, so the type-aware rules that police the
  // `as unknown as X` casts our mocks rely on are noise here. Type information
  // itself stays on, because the obsidianmd rules require it.
  {
    files: ['src/**/*.test.ts', 'src/__tests__/**/*.ts', 'src/__mocks__/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',

      // Tests use require() deliberately, to observe when a module is loaded
      '@typescript-eslint/no-require-imports': 'off',

      // Mock implementations are declared async to match the Promise-returning
      // signature they stand in for, without needing to await anything
      '@typescript-eslint/require-await': 'off',

      // The obsidian mock has to import the real moment, and builds its DOM
      // with plain jsdom rather than Obsidian's helpers
      '@typescript-eslint/no-restricted-imports': 'off',
      'obsidianmd/prefer-create-el': 'off',

      // Test code runs under Node in Jest, never on mobile or in a popout
      'obsidianmd/no-nodejs-modules': 'off',
      'obsidianmd/prefer-window-timers': 'off',
      'obsidianmd/rule-custom-message': 'off',
    },
  },

  // The DOM shim deliberately reimplements the Obsidian helpers that jsdom does
  // not provide, so the rules that police how plugin source *uses* that API do
  // not apply to the definitions themselves
  {
    files: ['src/__tests__/setup.ts'],
    rules: {
      'obsidianmd/no-global-this': 'off',
      'obsidianmd/no-static-styles-assignment': 'off',
      'obsidianmd/prefer-instanceof': 'off',
    },
  }
);
