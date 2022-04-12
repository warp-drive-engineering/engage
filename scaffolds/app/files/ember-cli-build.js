'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const isTest = process.env.EMBER_CLI_TEST_COMMAND;
const isProd = process.env.EMBER_ENV === 'production';

module.exports = function (defaults) {
  const terserSettings = {
    exclude: ['assets/dummy.js', 'assets/tests.js', 'assets/test-support.js', 'dist/docs/*', 'docs/*'],
    terser: {
      compress: {
        ecma: 2016, // probably can be higher
        passes: 6, // slow, but worth it
        negate_iife: false,
        sequences: 30,
        defaults: true,
        arguments: true,
        keep_fargs: false,
        toplevel: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_proto: true,
        unsafe_undefined: true,
      },
      toplevel: true,
      sourceMap: false,
      ecma: 2016,
    },
  };

  if (isTest && isProd) {
    terserSettings.enabled = false;
  }

  let app = new EmberApp(defaults, {
    emberData: {
      compatWith: "4.3",
    },
    "esw-cache-fallback": {
      // RegExp patterns specifying which URLs to cache.
      // e.g "http://localhost:4200/api/v1/(.+)"
      patterns: [],

      // changing this version number will bust the cache
      version: "1",
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
  /*
  const { Webpack } = require('@embroider/webpack');
  return require('@embroider/compat').compatBuild(app, Webpack, {
    skipBabel: [
      {
        package: 'qunit',
      },
    ],
  });
  */
 // we can replace with the embroider compat above once
 // ember-service-worker/skyrocket/flexi etc. are embroider compat safe
 return app.toTree();
};
