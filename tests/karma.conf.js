// karma configuration
var karma_conf = {
  basePath: '../',
  browserify: {
    debug: true,
    transform: [
      ['babelify', {presets: ['es2015']}],
      [
        'browserify-istanbul', {
          instrumenterConfig: {
            embedSource: true
          }
        }
      ]
    ]
  },
  //browsers: ['Firefox', 'Chrome'],
  //browsers: ['Chromium'],
  client: {
    captureConsole: true,
    mocha: {'ui': 'tdd'}
  },
  envPreprocessor: [
    'TEST_ENV'
  ],
  files: [
    //dependencies
    {pattern: 'tests/testDependencies.js', included: true}, 
    //module
    {pattern: 'index.js', included: true},
    // Define test files.
    {pattern: 'tests/**/*.test.js'},
    // Serve test assets.
    //{pattern: 'tests/assets/**/*', included: false, served: true}
  ],
  frameworks: ['mocha', 'sinon-chai', 'chai-shallow-deep-equal', 'browserify'],
  preprocessors: {
    'tests/testDependencies.js': ['browserify'],
    'index.js': ['browserify'],
    'tests/**/*.js': ['browserify', 'env']
  },
  reporters: ['mocha']
};

// configuration for code coverage reporting
if (process.env.TEST_ENV === 'ci') {

  karma_conf.coverageReporter = {
    dir: 'tests/coverage',
    includeAllSources: true,
    reporters: [
      {'type': 'html', subdir: 'report'},
      {'type': 'lcov', subdir: '.'}
    ]
  };
  karma_conf.reporters.push('coverage');
  karma_conf.preprocessors['index.js'].push(['coverage']);
}

// Apply configuration
module.exports = function (config) {
  config.set(karma_conf);
};
