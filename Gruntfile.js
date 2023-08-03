module.exports = function(grunt) {
	grunt.initConfig({
		// Build the site using grunt-includes
		includes: {
			build: {
				cwd: 'html',
				src: [ '*.html' ],
				dest: './',
				options: {
					flatten: true,
					includePath: 'include',
				}
			}
		},

		// Replace .html from header links
		'string-replace': {
			dist: {
				files: {
					'./': '*.html'
				},
				options: {
					replacements: [{
						pattern: /.html/g,
						replacement: ''
					}]
				}
			}
		}
	});

	// Load Tasks
	grunt.loadNpmTasks('grunt-includes');
	grunt.loadNpmTasks("grunt-string-replace");

	// Task definitions
	grunt.registerTask('build', ['includes']);
	grunt.registerTask('prep-deploy', ['string-replace']);
};