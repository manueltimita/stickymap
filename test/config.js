var browsers;
if (process.env.TRAVIS) {
  browsers = ['Firefox'];
} else {
  browsers = ['Chrome'];
}

module.exports = function(config) {
  config.set({
    frameworks: ['source-map-support', 'browserify', 'mocha'],
    browsers: browsers,
    files: [
      '**/*.spec.js'
    ],
    preprocessors: {
      '**/*.js': ['browserify']
    },
    browserify: {
      debug: true
    }
  });
};
