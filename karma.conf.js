module.exports = function(config) {
    var path = require('path');

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'node_modules/lodash/lodash.js',
            'node_modules/jquery/dist/jquery.js',
            'src/*.js',
            'test/*.js'
        ],
        exclude: [],
        preprocessors: {},
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        phantomjsLauncher: {
            cmd: {
              win32: path.join(__dirname, 'phantomjs/phantomjs.exe')
            }
        },
        singleRun: false
    });
};
