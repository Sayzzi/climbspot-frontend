import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Architectural layers. Imports flow `app → routes → features → shared`, never backwards,
 * and a feature never imports another feature: they are composed in routes. The first
 * matching descriptor wins, so the `src` catch-all (the entry point) comes last.
 */
const elements = [
  { type: 'app', pattern: 'src/app', partialMatch: false },
  { type: 'routes', pattern: 'src/routes', partialMatch: false },
  { type: 'feature', pattern: 'src/features/*', partialMatch: false, capture: ['feature'] },
  { type: 'shared', pattern: 'src/shared', partialMatch: false },
  { type: 'locales', pattern: 'src/locales', partialMatch: false },
  { type: 'test-setup', pattern: 'src/test', partialMatch: false },
  { type: 'entry', pattern: 'src', partialMatch: false },
];

const to = (...types) => ({ to: { element: { types } } });

export default defineConfig(
  globalIgnores(['dist', 'coverage', 'src/app/routeTree.gen.ts', 'src/shared/api/schema.gen.ts']),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  jsxA11y.flatConfigs.recommended,
  pluginQuery.configs['flat/recommended'],
  pluginRouter.configs['flat/recommended'],
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Route files export a `Route` object next to their components; the router plugin
    // splits them apart (autoCodeSplitting), so fast refresh keeps working.
    files: ['src/routes/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    // Tests and their helpers render the whole app, so they may import any layer.
    ignores: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'import/resolver': { typescript: { project: './tsconfig.app.json' }, node: true },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: { element: { type: 'entry' } }, allow: [to('app', 'shared')] },
            {
              from: { element: { type: 'app' } },
              allow: [to('app', 'routes', 'feature', 'shared')],
            },
            { from: { element: { type: 'routes' } }, allow: [to('routes', 'feature', 'shared')] },
            {
              from: { element: { type: 'feature' } },
              allow: [
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { feature: '{{ from.element.captured.feature }}' },
                    },
                  },
                },
                to('shared'),
              ],
            },
            { from: { element: { type: 'shared' } }, allow: [to('shared', 'locales')] },
            { from: { element: { type: 'test-setup' } }, allow: [to('shared')] },
          ],
        },
      ],
    },
  },

  prettier,
);
