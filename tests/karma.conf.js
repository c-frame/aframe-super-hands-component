const path = require('path')
// karma configuration
const karmaConf = {
  basePath: '../',
  browserify: {
    debug: true,
    // avoid errors when attempting to process pre-bundled file
    noParse: [
      path.resolve('./node_modules/@c-frame/aframe-physics-system/dist/aframe-physics-system.js'),
      path.resolve('./node_modules/aframe/dist/aframe-master.js'),
      path.resolve('./node_modules/aframe-extras/dist/aframe-extras.misc.js')
    ],
    transform: [
      ['babelify']
    ]
  },
  browsers: ['Chrome', 'Firefox_NoVR'],
  // browsers: ['FirefoxNightly', 'Chromium_WebVR'],
  client: {
    captureConsole: true,
    mocha: { ui: 'tdd' }
  },
  customLaunchers: {
    Chromium_WebVR: {
      base: 'Chromium',
      flags: ['--enable-webvr', '--enable-gamepad-extensions']
    },
    Firefox_NoVR: {
      base: 'Firefox',
      prefs: {
        'dom.vr.enabled': false
      }
    }
  },
  envPreprocessor: [
    'TEST_ENV'
  ],
  files: [
    // dependencies
    { pattern: 'tests/testDependencies.js', included: true },
    // module
    { pattern: 'index.js', included: true },
    // Define test files.
    { pattern: 'tests/**/*.test.js' }
    // Serve test assets.
    // {pattern: 'tests/assets/**/*', included: false, served: true}
  ],
  frameworks: ['mocha', 'sinon-chai', 'chai-shallow-deep-equal', 'browserify'],
  preprocessors: {
    'tests/testDependencies.js': ['browserify'],
    'index.js': ['browserify'],
    'tests/**/*.js': ['browserify', 'env']
  },
  reporters: ['mocha']
}

// Apply configuration
module.exports = function (config) {
  config.set(karmaConf)
}
