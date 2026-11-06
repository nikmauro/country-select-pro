const gulp = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const {Transform} = require('stream');

// Συμπίεση του CSS που είναι μέσα στο JS (const CSS = `...`) — το terser δεν αγγίζει τα strings
const compactCss = () => new Transform({
    objectMode: true,
    transform(file, enc, cb) {
        const src = file.contents.toString();
        const out = src.replace(/(const CSS = `)([\s\S]*?)(`;)/, (m, start, css, end) => start + css
            .replace(/\/\*[\s\S]*?\*\//g, '')       // σχόλια
            .replace(/\s+/g, ' ')                    // κενά / αλλαγές γραμμής
            .replace(/\s*([{};,>])\s*/g, '$1')       // όχι γύρω από '+' (calc)
            .replace(/:\s+/g, ':')                   // μόνο ΜΕΤΑ το ':' (πριν: .x :invalid)
            .replace(/;}/g, '}')
            .trim() + end);
        file.contents = Buffer.from(out);
        cb(null, file);
    }
});

gulp.task('build', function () {
    return gulp.src('dist/country-select.js')   // η πηγή — μένει αυτούσια στο dist/
        .pipe(compactCss())
        .pipe(terser())                         // minification (κρατά το /*! ... */ της άδειας)
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist'));               // dist/country-select.min.js
});
