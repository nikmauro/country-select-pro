/**
 * Σημειώσεις για το GitHub Release μιας έκδοσης, από το CHANGELOG.md
 *   node scripts/release-notes.js 6.4.0 > notes.md
 */
const fs = require('fs');
const path = require('path');

const v = process.argv[2];
if (!v) throw new Error('Usage: node scripts/release-notes.js <version>');

const log = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n');
const start = log.indexOf('## [' + v + ']');
if (start < 0) throw new Error('CHANGELOG.md: no section for ' + v);
const body = log.slice(log.indexOf('\n', start) + 1);
const end = body.search(/^## \[|^\[\d+\.\d+\.\d+\]: /m);
const section = (end < 0 ? body : body.slice(0, end)).trim();

process.stdout.write(section + `

---

\`\`\`bash
npm install country-select-pro@${v}
\`\`\`
\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/country-select-pro@${v}/dist/country-select.min.js" defer></script>
\`\`\`

**Demo & settings playground:** https://nikmauro.github.io/country-select-pro/docs/ · **Changelog:** https://github.com/nikmauro/country-select-pro/blob/main/CHANGELOG.md
`);
