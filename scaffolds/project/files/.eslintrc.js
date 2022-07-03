'use strict';

const ImportSortGroups = [
  // Side effect imports.
  // eslint-disable-next-line no-useless-escape
  [`^\u0000`],
  // Packages.
  // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
  // But not our packages, ember/glimmer/ember-data packages, or potential addons (things starting with ember- or @ember-)
  [
    // eslint-disable-next-line no-useless-escape
    `^(?!@ember\-data)(?!ember)(?!@ember\-)(?!@glimmer)(?!@<<<<escapedGithubOrg>>>>/)(?!<<<<escapedGithubOrg>>>>\-)(@?\\w)`,
  ],
  // Glimmer & Ember & EmberData Dependencies
  // eslint-disable-next-line no-useless-escape
  [`^(@ember/|@glimmer|ember|@ember\-data/$)`],
  // Potential Addons (Packages starting with ember-)
  // eslint-disable-next-line no-useless-escape
  [`^(ember\-|@ember\-)`],
  // Our sub packages (engines / addons)
  // eslint-disable-next-line no-useless-escape
  [`^@<<<<escapedGithubOrg>>>>/`],
  // Our Main Package.
  // eslint-disable-next-line no-useless-escape
  [`^<<<<escapedGithubOrg>>>>\-`],
  // Absolute imports and other imports such as Vue-style `@/foo`.
  // Anything that does not start with a dot.
  ['^[^.]'],
  // Relative imports.
  // Anything that starts with a dot.
  // eslint-disable-next-line no-useless-escape
  [`^\.`],
];

module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    babelOptions: {
      plugins: [
        [
          require.resolve('@babel/plugin-proposal-decorators'),
          { legacy: true },
        ],
      ],
    },
    requireConfigFile: false,
  },
  plugins: [
    'ember',
    'qunit',
    'simple-import-sort',
    'import',
    'unused-imports',
    'unicorn',
    'no-useless-assign',
  ],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended',
    'plugin:qunit/recommended',
    'plugin:unicorn/recommended',
  ],
  globals: {},
  env: {
    browser: true,
  },
  rules: {
    eqeqeq: 'error',
    'no-eq-null': 'error',
    'prefer-rest-params': 'error',
    'no-shadow': 'error',
    'no-loop-func': 'error',
    'no-lonely-if': 'error',
    'no-labels': 'error',
    'no-dupe-keys': 'error',
    'no-dupe-else-if': 'error',
    'no-var': 'error',
    'no-prototype-builtins': 'error',

    // these are a nice proxy measurement of where there is complexity to pay down
    // but not hugely important to always follow since they are easily trollish
    'max-params': ['error', { max: 4 }],
    'max-depth': ['error', { max: 4 }],
    'max-statements': ['error', { max: 40 }],
    'max-lines-per-function': [
      'error',
      { max: 80, skipBlankLines: true, skipComments: true },
    ],
    complexity: ['error', { max: 20 }],
    'no-magic-numbers': [
      'error',
      { ignore: [0, 1, -1], ignoreArrayIndexes: true },
    ],

    'no-unused-vars': 'off', // or "@typescript-eslint/no-unused-vars": "off",
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],

    // Activated general rules
    'object-shorthand': ['error', 'always'],
    'no-restricted-imports': [
      'error',
      {
        paths: ['@ember/runloop'],
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: '$',
        property: 'get',
        message:
          'use the requests service method requests.$get instead of $.get',
      },
      {
        object: '$',
        property: 'post',
        message:
          'use the requests service method requests.$post instead of $.post',
      },
      {
        object: '$',
        property: 'ajax',
        message:
          'use the requests service method requests.$ajax instead of $.ajax',
      },
      {
        object: '$',
        property: 'ajaxSetup',
        message:
          'use the requests service method requests.$ajaxSetup instead of $.ajaxSetup',
      },
      {
        object: '$',
        property: 'ajaxPrefilter',
        message:
          'use the requests service method requests.$ajaxPrefilter instead of $.ajaxPrefilter',
      },
      {
        object: '$',
        property: 'getJSON',
        message:
          'use the requests service method requests.$getJSON instead of $.getJSON',
      },
    ],
    'one-var': ['error', 'never'],
    'prefer-const': 'error',
    'require-await': 'error',
    'prefer-spread': 'error',
    'no-unreachable-loop': 'error',
    'no-lone-blocks': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-rename': 'error',
    'no-useless-computed-key': 'error',
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      { enforceForRenamedProperties: false },
    ],
    'no-implicit-globals': 'error',
    'dot-notation': 'error',
    'no-redeclare': 'error',
    'no-cond-assign': ['error', 'except-parens'],
    'no-unmodified-loop-condition': 'error',
    'no-use-before-define': 'error',
    'no-console': 'error',
    'no-eval': 'error',
    'no-else-return': 'error',
    'no-self-assign': 'error',
    'no-self-compare': 'error',
    'new-cap': [
      'error',
      { capIsNewExceptions: ['Stripe', 'A'], newIsCapExceptions: ['jsPDF'] },
    ],
    'no-caller': 'error',

    // Easy to activate cleanups
    'no-useless-assign/no-useless-assign': 'error',
    'ember/no-incorrect-calls-with-inline-anonymous-functions': 'error',
    'ember/no-deeply-nested-dependent-keys-with-each': 'error',
    'ember/jquery-ember-run': 'error',
    'qunit/no-assert-equal-boolean': 'error',
    'qunit/require-expect': 'error',
    'qunit/no-compare-relation-boolean': 'error',
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message: 'Use the local-storage service instead',
      },
    ],

    // Too many false positives
    // See https://github.com/eslint/eslint/issues/11899 and similar
    'require-atomic-updates': 'off',

    'simple-import-sort/imports': ['error', { groups: ImportSortGroups }],
    'sort-imports': 'off',
    'import/order': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    // this rule doesn't work properly with --fix
    // https://github.com/benmosher/eslint-plugin-import/issues/1504
    'import/no-duplicates': 'warn',

    'ember/routes-segments-snake-case': 'off', // We should leave this off permanently
    'ember/use-brace-expansion': 'off', // has bugs and is annoying + only applies to computeds

    'ember/no-classic-classes': 'error',
    'ember/no-get': 'error',
    'ember/no-jquery': 'error',
    'ember/require-return-from-computed': 'error',
    'ember/no-actions-hash': 'error',
    'ember/avoid-leaking-state-in-ember-objects': 'error',
    'ember/no-mixins': 'error',
    'ember/no-new-mixins': 'error',
    'ember/no-controller-access-in-routes': 'error',
    'ember/closure-actions': 'error',
    'ember/no-component-lifecycle-hooks': 'error',
    'ember/no-observers': 'error',
    'ember/require-tagless-components': 'error',
    'ember/no-classic-components': 'error',
    'ember/no-side-effects': 'error',

    // unicorn
    'unicorn/prefer-module': 'off',
    'unicorn/no-array-for-each': 'off', // this might be nice someday? better if it would do regular for loops for arrays
    'unicorn/number-literal-case': 'off', // conflicts with prettier
    'unicorn/no-nested-ternary': 'off', // conflicts with prettier
    'unicorn/no-null': 'off', // too WAT
    'unicorn/consistent-destructuring': 'off', // nice in some ways but heavy handed
    'unicorn/prefer-spread': 'off', // possibly nice if we had native arrays
    'unicorn/no-for-loop': 'off', // if for...of was good maybe we'd use this
    'unicorn/prefer-add-event-listener': 'error',
    'unicorn/better-regex': 'off', // would be awesome but has bugs https://github.com/sindresorhus/eslint-plugin-unicorn/issues?q=is%3Aissue+is%3Aopen+better-regex

    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-default-parameters': 'error',
    'unicorn/prefer-number-properties': 'error', // note Number.isNaN and Number.isFinite usage differs from global
    'unicorn/numeric-separators-style': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/catch-error-name': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/no-lonely-if': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-array-find': 'error',
    'unicorn/prefer-array-some': 'error',
    'unicorn/prefer-string-replace-all': 'error',
    'unicorn/explicit-length-check': 'error',
    'unicorn/no-unsafe-regex': 'error',

    // to consider activating
    'unicorn/prefer-negative-index': 'off',
    'unicorn/prefer-dom-node-append': 'off',
    'unicorn/prefer-dom-node-remove': 'off',
    'unicorn/prefer-query-selector': 'off',
    'unicorn/prefer-switch': 'off',
    'unicorn/prefer-string-slice': 'off',
    'unicorn/no-array-push-push': 'off',
    'unicorn/no-zero-fractions': 'off',
    'unicorn/consistent-function-scoping': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/new-for-builtins': 'off',
    'unicorn/escape-case': 'off',
    'unicorn/no-this-assignment': 'off',
    'unicorn/prefer-set-has': 'off',
    'unicorn/prefer-export-from': 'off',
    'unicorn/prefer-code-point': 'off',
    'unicorn/require-array-join-separator': 'off',
    'unicorn/error-message': 'off',
    'unicorn/no-array-callback-reference': 'off', // we may never want this
    'unicorn/prevent-abbreviations': [
      'off',
      {
        checkFilenames: false,
        checkDefaultAndNamespaceImports: false,
        extendDefaultReplacements: false,
        replacements: {
          e: {
            error: true,
            event: true,
          },
        },
      },
    ],
  },
  overrides: [
    // TypeScript files in strict-mode
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        tsConfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        'no-unused-vars': 'off',
        'unused-imports/no-unused-vars': 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': ['error'],
      },
    },
    // typescript files in non-strict mode
    {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        tsConfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        'ember-data/prefer-static-type-import': 'error',
        'no-unused-vars': 'off',
        // rules we should likely activate but which currently have too many violations
        // files converted to strict must pass these rules before they can be removed from
        // the files list here and the files list in tsconfig.json
        // see https://github.com/emberjs/data/issues/6233#issuecomment-849279594
        '@typescript-eslint/no-explicit-any': 'off', // TODO activate this and use // eslint-disable-line @typescript-eslint/no-explicit-any
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/restrict-plus-operands': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
      files: ['./not-a-real-file.ts'],
    },
    // node files
    {
      files: [
        'bin/**/*.js',
        'addons/*/addon-main.js',
        '.eslintrc.js',
        '.lint-todorc.js',
        '.prettierrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        '*/*/ember-cli-build.js',
        'lib/**/*.js',
        '*/*/testem.js',
        'addons/*/blueprints/*/index.js',
        'apps/*/config/**/*.js',
        'engines/*/config/**/*.js',
        'apps/*/tests/dummy/config/**/*.js',
        'addons/*/tests/dummy/config/**/*.js',
        'engines/*/tests/dummy/config/**/*.js',
        'apps/*/index.js',
        'engines/*/index.js',
        'addons/*/index.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
      rules: {
        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'node/no-unpublished-require': 'off',
      },
    },
  ],
};
