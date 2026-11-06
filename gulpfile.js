/**
 * Build — πηγή: dist/country-select.js (script / CommonJS, αυτούσιο)
 *   dist/country-select.min.js   minified
 *   dist/country-select.mjs      ES module (import CountrySelect from 'country-select-pro')
 *   dist/country-select.css      το CSS της βιβλιοθήκης ως αρχείο (αυστηρό CSP, χωρίς <style> από το JS)
 *   dist/country-select.min.css
 * Όλα τα παραπάνω μπαίνουν στο npm (npm publish → prepublishOnly → build), όχι στο git.
 */
const gulp = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const fs = require('fs');
const {Transform} = require('stream');

const SRC = 'dist/country-select.js';

const header = () => fs.readFileSync(SRC, 'utf8').split('\n')[0]; // /*! CountrySelect Pro vX | MIT | url */

// Συμπίεση CSS (χωρίς κενά γύρω από '+' — calc — και χωρίς να αγγίζει το κενό ΠΡΙΝ από ':' — .x :invalid)
const compact = (css) => css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .trim();

// Το CSS που είναι μέσα στο JS (const CSS = `...`), με το ${ARROW} αντικατεστημένο
function extractCss() {
    const src = fs.readFileSync(SRC, 'utf8');
    const css = src.match(/const CSS = `([\s\S]*?)`;/)[1];
    const arrow = JSON.parse(src.match(/const ARROW = ("(?:[^"\\]|\\.)*");/)[1]);
    return css.replace(/\$\{ARROW\}/g, arrow).trim();
}

const transform = (fn) => new Transform({
    objectMode: true,
    transform(file, enc, cb) {
        file.contents = Buffer.from(fn(file.contents.toString()));
        cb(null, file);
    }
});

// ---- .min.js — με συμπιεσμένο το CSS μέσα στο JS (το terser δεν αγγίζει τα strings)
gulp.task('build:min', () => gulp.src(SRC)
    .pipe(transform((src) => src.replace(/(const CSS = `)([\s\S]*?)(`;)/, (m, a, css, b) => a + compact(css) + b)))
    .pipe(terser())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist')));

// ---- .mjs — το ίδιο αρχείο + export (το IIFE ορίζει το globalThis.CountrySelect)
gulp.task('build:esm', (done) => {
    const src = fs.readFileSync(SRC, 'utf8');
    const out = src + '\n// ES module\n'
        + 'const CountrySelect = globalThis.CountrySelect;\n'
        + 'export default CountrySelect;\n'
        + 'export {CountrySelect};\n';
    fs.writeFileSync('dist/country-select.mjs', out);
    done();
});

// ---- .css / .min.css — με τη σήμανση --cs-css, ώστε το JS να μην προσθέσει δικό του <style>
gulp.task('build:css', (done) => {
    const css = extractCss();
    const marker = ':root { --cs-css: 1; } /* σήμανση: το JS δεν προσθέτει <style> */';
    const top = header().replace('*/', '— CSS */');
    fs.writeFileSync('dist/country-select.css', top + '\n' + marker + '\n\n' + css + '\n');
    fs.writeFileSync('dist/country-select.min.css', top + '\n' + compact(':root{--cs-css:1}' + css) + '\n');
    done();
});

gulp.task('build', gulp.parallel('build:min', 'build:esm', 'build:css'));
