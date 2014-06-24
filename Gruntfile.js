module.exports = function(grunt) {
	
	grunt.initConfig({

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
		},
        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            unit: {
                singleRun: true
            },

            continuous: {
                singleRun: false,
                autoWatch: true
            }
        }


	});

	grunt.loadNpmTasks('grunt-contrib-jshint');

};