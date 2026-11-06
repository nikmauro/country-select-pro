/**
 * npm version <patch | minor | major> → ο νέος αριθμός παντού (npm "version" hook: μετά το package.json, πριν από το commit / tag)
 *   dist/country-select.js   η γραμμή άδειας και η κεφαλίδα (CountrySelect Pro vX) · const VERSION
 *   README.md                τα links του CDN (country-select-pro@X/)
 *   CHANGELOG.md             [Unreleased] → [X] – σημερινή ημερομηνία (+ νέο κενό [Unreleased]) · link σύγκρισης
 * Μετά: git push --follow-tags → GitHub Actions (release.yml): tests → npm publish → GitHub Release
 */
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const ROOT = path.join(__dirname, '..');
const REPO = 'https://github.com/nikmauro/country-select-pro';
const file = (f) => path.join(ROOT, f);
const read = (f) => fs.readFileSync(file(f), 'utf8');
const write = (f, s) => fs.writeFileSync(file(f), s);

const v = JSON.parse(read('package.json')).version;
if (!/^\d+\.\d+\.\d+$/.test(v)) throw new Error('Unexpected version: ' + v);
const today = new Date().toISOString().slice(0, 10);

// Προηγούμενη έκδοση = το τελευταίο tag (το νέο δεν έχει γίνει ακόμα)
let prev = '';
try {
    prev = execSync('git tag --list "[0-9]*.[0-9]*.[0-9]*" --sort=-v:refname', {cwd: ROOT}).toString().split(/\s+/).filter(Boolean)
        .find((t) => t !== v) || '';
} catch (e) { /* χωρίς git */ }

// 1. Πηγή
let js = read('dist/country-select.js');
js = js.replace(/CountrySelect Pro v\d+\.\d+\.\d+/g, 'CountrySelect Pro v' + v).replace(/const VERSION = '[^']+'/, "const VERSION = '" + v + "'");
write('dist/country-select.js', js);

// 2. README (CDN)
write('README.md', read('README.md').replace(/country-select-pro@\d+\.\d+\.\d+\//g, 'country-select-pro@' + v + '/'));

// 3. CHANGELOG
let log = read('CHANGELOG.md');
if (!log.includes('## [' + v + ']')) {
    if (!log.includes('## [Unreleased]')) throw new Error('CHANGELOG.md: no "## [Unreleased]" section');
    log = log.replace('## [Unreleased]', '## [Unreleased]\n\n## [' + v + '] – ' + today);
    const link = '[' + v + ']: ' + REPO + (prev ? '/compare/' + prev + '...' + v : '/releases/tag/' + v);
    log = log.replace(/^\[\d+\.\d+\.\d+\]: /m, (m) => link + '\n' + m);
    write('CHANGELOG.md', log);
}

execSync('git add dist/country-select.js README.md CHANGELOG.md', {cwd: ROOT});
console.log('version ' + v + (prev ? ' (previous ' + prev + ')' : '') + ' → dist/country-select.js, README.md, CHANGELOG.md');
