module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.css': ['src/application.css']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['src/application.js']
        }
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: 'application.xml',
          dest: 'dist/',
          rename: function(dest, filename) {
            return dest + '<%= pkg.name %>.xml';
          }
        }, {
          expand: true,
          cwd: 'images/',
          src: '*.png',
          dest: 'dist/'
        }]
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['jshint']);

  grunt.registerTask('default', ['jshint', 'uglify', 'cssmin', 'copy']);

};
