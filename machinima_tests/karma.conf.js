// karma configuration
var karma_conf = {
  basePath: '../',
  browserify: {
    debug: true,
    transform: [
      ['babelify', {presets: ['es2015']}]
    ]
  },
  //browsers: ['Firefox', 'Chrome'],
  //browsers: ['Chromium'],
  browsers: ['FirefoxNightly', 'Chromium_WebVR'],
  client: {
    captureConsole: true,
    mocha: {'ui': 'tdd'}
  },
  customLaunchers: {
    Chromium_WebVR: {
      base: 'Chromium',
      flags: ['--enable-webvr', '--enable-gamepad-extensions']
    }
  },
  envPreprocessor: [
    'TEST_ENV'
  ],
  files: [
    //dependencies
    {pattern: 'machinima_tests/testDependencies.js', included: true}, 
    //module
    {pattern: 'index.js', included: true},
    // Define test files.
    {pattern: 'machinima_tests/**/*.test.js'},
    // Serve test assets.
    //{pattern: 'tests/assets/**/*', included: false, served: true}
  ],
  frameworks: ['mocha', 'sinon-chai', 'chai-shallow-deep-equal', 'browserify'],
  preprocessors: {
    'machinima_tests/testDependencies.js': ['browserify'],
    'index.js': ['browserify'],
    'machinima_tests/**/*.js': ['browserify', 'env']
  },
  reporters: ['mocha']
};


// Apply configuration
module.exports = function (config) {
  config.set(karma_conf);
};
