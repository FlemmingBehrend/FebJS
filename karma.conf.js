module.exports = function(config) {
    var path = require('path');
    var darwinPath = path.join(__dirname, 'phantomjs/phantomjs');
    console.log(darwinPath);

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'node_modules/lodash/lodash.js',
            'node_modules/jquery/dist/jquery.js',
            'src/*.js'
        ],
        exclude: [],
        preprocessors: {},
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome'],
        singleRun: false
    });
};
