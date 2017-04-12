// karma configuration
var karma_conf = {
  basePath: '../',
  browserify: {
    debug: true,
    transform: [
      ['babelify', {presets: ['es2015']}]
    ]
  },
  //browsers: ['FirefoxNightly', 'Chromium_WebVR'],
  browsers: ['FirefoxNightly'],
  // machinima: prevent timeout during recording / playback
  browserNoActivityTimeout: 600000, 
  client: {
    captureConsole: true,
    mocha: {'ui': 'tdd'}
  },
  //customDebugFile: 'machinima_tests/karmadebug.html',
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
    // HTML scenes
    {pattern: 'machinima_tests/scenes/*.html'},
    // Serve recoridn files assets.
    {pattern: 'machinima_tests/recordings/*.json', included: false, served: true}
  ],
  frameworks: ['mocha', 'sinon-chai', 'chai-shallow-deep-equal', 'browserify'],
  preprocessors: {
    'machinima_tests/testDependencies.js': ['browserify'],
    'index.js': ['browserify'],
    'machinima_tests/**/*.js': ['browserify', 'env'],
    'machinima_tests/scenes/*.html': ['html2js']
  },
  reporters: ['mocha'],
  // machinima: make scene html available
  html2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'machinima_tests/scenes/',

      // prepend this to the file path
      //prependPrefix: 'served/',

      // or define a custom transform function
/*      processPath: function(filePath) {
        // Drop the file extension
        return filePath.replace(/\.html$/, '');
      }*/
    }
};


// Apply configuration
module.exports = function (config) {
  config.set(karma_conf);
};
