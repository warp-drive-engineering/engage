'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isTest = process.env.EMBER_CLI_TEST_COMMAND;
const isProd = process.env.EMBER_ENV === 'production';

module.exports = function (defaults) {
  const terserSettings = {
    exclude: [
      'assets/dummy.js',
      'assets/tests.js',
      'assets/test-support.js',
      'dist/docs/*',
      'docs/*',
    ],
    terser: {
      compress: {
					ecma: 2021,
					passes: 6, // slow, but worth it
					negate_iife: false,
					sequences: 30,
					defaults: true,
					arguments: false,
					keep_fargs: false,
					toplevel: false,
					unsafe: true,
					unsafe_comps: true,
					unsafe_math: true,
					unsafe_symbols: true,
					unsafe_proto: true,
					unsafe_undefined: true,
				},
				toplevel: false,
				sourceMap: false,
				ecma: 2021,
    },
  };

  if (isTest && isProd) {
    terserSettings.enabled = false;
  }

  const app = new EmberApp(defaults, {
    emberData: {
      compatWith: '4.3',
    },
    autoImport: {
      exclude: [],
      skipBabel: [],
      webpack: {
        plugins: [
          new BundleAnalyzerPlugin({
						analyzerMode: 'static',
						openAnalyzer: false,
						reportFilename: 'auto-import-bundles.html',
					}),
        ]
      },
      externals: {}
    },
    'fingerprint': {
			exclude: [],
			extensions: ['js', 'css', 'png', 'jpg', 'gif', 'map', 'json'],
			generateAssetMap: true,
			fingerprintAssetMap: true,
		},
    'ember-cli-deprecation-workflow': {
			enabled: true,
		},
    'ember-cli-babel': {
      throwUnlessParallelizable: true,
      includeExternalHelpers: true,
    },
    'ember-cli-terser': terserSettings,
  });

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    splitAtRoutes: [],
    packagerOptions: {
      // publicAssetURL: EmberApp.env() === 'production' ? 'https://your-cdn-here.com/' : '/', // This should be a URL ending in "/"
      webpackConfig: {
        plugins: [
          new BundleAnalyzerPlugin({
            generateStatsFile: true,
            openAnalyzer: false,
            statsFilename: path.join(
              process.cwd(),
              'concat-stats-for',
              'asset-stats.json'
            ),
          }),
        ],
      },
    },
  });
};
