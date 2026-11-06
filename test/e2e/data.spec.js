// Η ενσωματωμένη λίστα χωρών (χωρίς browser): μορφή, μοναδικοί κωδικοί, σημαία για κάθε χώρα, ίδια με το data.json
const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'dist/country-select.js'), 'utf8');
const block = src.slice(src.indexOf('/* DATA:START */ `') + 18, src.indexOf('` /* DATA:END */')).trim();
const lines = block.split(/\r?\n/); // και με CRLF (git autocrlf στα Windows)
const rows = lines.map((l) => {
    const p = l.split('|');
    return {code: p[0], name: p[1], phone: p[2] ? '+' + p[2] : '', alt: p[3] || ''};
});

test('250 countries, valid lines, unique ISO codes', () => {
    expect(rows.length).toBe(250);
    for (const l of lines) expect(l).toMatch(/^[A-Z]{2}\|[^|]+\|\d{0,4}(\|[^|]+)?$/);
    expect(new Set(rows.map((r) => r.code)).size).toBe(250);
});

test('every country has a 4x3 flag', () => {
    const missing = rows.filter((r) => !fs.existsSync(path.join(ROOT, 'dist/flags/4x3', r.code.toLowerCase() + '.svg')));
    expect(missing.map((r) => r.code)).toEqual([]);
});

test('known values', () => {
    const by = Object.fromEntries(rows.map((r) => [r.code, r]));
    expect(by.GR).toMatchObject({name: 'Greece', phone: '+30'});
    expect(by.US).toMatchObject({name: 'United States', phone: '+1'});
    expect(by.VA.phone).toBe('+39');
    expect(by.BV.phone).toBe('');
    expect(by.TR.alt).toContain('Turkey');
    expect(by.XK).toMatchObject({name: 'Kosovo', phone: '+383'});
});

test('dist/data.json is the same list', () => {
    const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/data.json'), 'utf8'));
    expect(json).toEqual(rows.map((r) => ({code: r.code, name: r.name, phone: r.phone})));
});
