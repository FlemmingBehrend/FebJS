module.exports = function(grunt) {
	grunt.initConfig({
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		},
		jshint: {
			all: ['*.js'],
			options: {
				globals: {
					_: false,
					$: false
				},
				browser: true,
				devel: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-karma');

};