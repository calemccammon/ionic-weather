// @ts-check
const ionic = require('@ionic/eslint-config/recommended');
const angular = require('angular-eslint');
const { defineConfig } = require('eslint/config');

/**
 * A rule set for one layer: the files under `files` may not import anything
 * matching `forbidden`. Tests are left out, since they bring in fakes.
 */
function layer(files, message, forbidden) {
  return {
    files: [files].flat(),
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: forbidden, message }] }],
    },
  };
}

module.exports = defineConfig([
  {
    ignores: ['www/**', 'dist/**', 'coverage/**', '.angular/**', 'android/**', 'ios/**'],
  },
  ionic,
  {
    files: ['**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/component-class-suffix': [
        'error',
        {
          suffixes: ['Page', 'Component'],
        },
      ],
    },
  },
  // Clean Architecture: dependencies point inward only. Each layer is barred
  // from importing what lies outside it.
  layer('src/app/domain/**/*.ts', 'The domain imports nothing but itself: no other layer and no library.', [
    '**/data/**',
    '**/ui/**',
    '**/di/**',
    '**/l10n/**',
    '@angular/*',
    '@ionic/*',
    '@capacitor/*',
    'maplibre-gl',
    'rxjs',
    'rxjs/*',
  ]),
  layer('src/app/data/**/*.ts', 'Data implements the domain and knows nothing of the screen or the wiring.', [
    '**/ui/**',
    '**/di/**',
    '**/l10n/**',
    '@angular/*',
    '@ionic/*',
  ]),
  layer('src/app/ui/**/*.ts', 'The screen reaches data only through the domain, and is handed what it needs.', [
    '**/data/**',
    '**/di/**',
    '@capacitor/*',
  ]),
  layer(
    ['src/app/ui/home/components/**/*.ts', 'src/app/ui/home/home.page.ts'],
    'Components draw UI models and know nothing of the domain, the data or the wiring.',
    ['**/domain/**', '**/data/**', '**/di/**', '@capacitor/*'],
  ),
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
