const gulp = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');

gulp.task('build', function() {
    return gulp.src('dist/country-select.js') // Το αρχικό σου αρχείο
        .pipe(gulp.dest('dist'))        // Το σώζει αυτούσιο στο dist/
        .pipe(terser())                 // Το συμπιέζει (minification)
        .pipe(rename({ suffix: '.min' })) // Του προσθέτει το .min
        .pipe(gulp.dest('dist'));       // Το σώζει και αυτό στο dist/
});