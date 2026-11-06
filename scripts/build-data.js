/**
 * Λίστα χωρών (npm run build:data) — από πηγές με γνωστή άδεια:
 *   κωδικοί   ISO 3166-1 alpha-2 (δημόσιο πρότυπο) + XK (Kosovo, κοινή χρήση)
 *   ονόματα   Unicode CLDR — μέσω Intl.DisplayNames του Node (full ICU) · Unicode License V3
 *   κλήση     ITU-T E.164 (δημόσιο πρότυπο) — έλεγχος με libphonenumber-js (MIT, metadata του Google libphonenumber, Apache-2.0)
 *
 * Γράφει:
 *   dist/country-select.js   τη λίστα ανάμεσα στα /* DATA:START *\/ … /* DATA:END *\/ (χωρίς fetch στο runtime)
 *   dist/data.json           την ίδια λίστα: [{code, name, phone}]
 */
const fs = require('fs');
const path = require('path');
const lib = require('libphonenumber-js');

const ROOT = path.join(__dirname, '..');

const CODES = [
    'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE',
    'BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD',
    'CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM',
    'DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF',
    'GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU',
    'ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN',
    'KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME',
    'MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA',
    'NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM',
    'PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI',
    'SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK',
    'TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI',
    'VN VU WF WS XK YE YT ZA ZM ZW'
].join(' ').split(' ');

// Εδάφη χωρίς δικό τους σχέδιο αριθμοδότησης στο libphonenumber — κωδικός κλήσης κατά ITU-T E.164 ('' = κανένας)
const PHONE_ITU = {AQ: '672', BV: '', GS: '500', HM: '672', PN: '64', TF: '262', UM: '1'};

// Ονόματα: CLDR, με το «&» / «St.» γραμμένα ολόκληρα και τα κοινά σύντομα ονόματα όπου το CLDR έχει περιγραφή
const NAME_FIX = {
    CD: 'DR Congo', CG: 'Congo', HK: 'Hong Kong', MO: 'Macao', MM: 'Myanmar', PS: 'Palestine',
    VC: 'Saint Vincent and the Grenadines', GS: 'South Georgia and the South Sandwich Islands',
    UM: 'U.S. Minor Outlying Islands'
};

// Άλλα ονόματα, χωρισμένα με «; » (αναζήτηση + valueType "name" με παλιές / επίσημες τιμές)
const ALSO = {
    CD: 'Congo-Kinshasa; DRC', CG: 'Congo-Brazzaville', CI: 'Ivory Coast', CV: 'Cabo Verde', CZ: 'Czech Republic',
    MK: 'Macedonia', MO: 'Macau', SZ: 'Swaziland', TR: 'Turkey', TL: 'East Timor', VA: 'Holy See',
    SH: 'Saint Helena, Ascension and Tristan da Cunha', GS: 'South Georgia', UM: 'United States Minor Outlying Islands',
    VI: 'United States Virgin Islands', TF: 'French Southern and Antarctic Lands', HM: 'Heard Island and McDonald Islands',
    KR: 'Korea, Republic of', KP: "Korea, Democratic People's Republic of", RU: 'Russian Federation', LA: "Lao People's Democratic Republic",
    SY: 'Syrian Arab Republic', IR: 'Iran, Islamic Republic of', BO: 'Bolivia, Plurinational State of', VE: 'Venezuela, Bolivarian Republic of',
    TZ: 'Tanzania, United Republic of', MD: 'Moldova, Republic of', FM: 'Micronesia, Federated States of', BN: 'Brunei Darussalam'
};

const cldr = new Intl.DisplayNames(['en'], {type: 'region', fallback: 'none'});

const rows = CODES.map((code) => {
    let name = NAME_FIX[code] || cldr.of(code);
    if (!name) throw new Error('No CLDR name for ' + code);
    if (!NAME_FIX[code]) name = name.replace(/ & /g, ' and ').replace(/^St\. /, 'Saint ');
    let phone;
    if (Object.prototype.hasOwnProperty.call(PHONE_ITU, code)) phone = PHONE_ITU[code];
    else if (lib.isSupportedCountry(code)) phone = lib.getCountryCallingCode(code);
    else throw new Error('No calling code for ' + code);
    for (const v of [name, ALSO[code] || '']) if (/[|\n`\\$]/.test(v)) throw new Error('Bad character in ' + code);
    return {code, name, phone, also: ALSO[code] || ''};
});

// ---- μέσα στο JS: μία γραμμή ανά χώρα «CODE|Name|phone|άλλα ονόματα»
const jsFile = path.join(ROOT, 'dist/country-select.js');
const js = fs.readFileSync(jsFile, 'utf8');
const eol = js.includes('\r\n') ? '\r\n' : '\n'; // ίδιες αλλαγές γραμμής με το αρχείο (git autocrlf στα Windows)
const block = rows.map((r) => [r.code, r.name, r.phone].concat(r.also ? [r.also] : []).join('|')).join(eol);
const re = /(\/\* DATA:START \*\/ `\r?\n)[\s\S]*?(\r?\n` \/\* DATA:END \*\/)/;
if (!re.test(js)) throw new Error('DATA markers not found in dist/country-select.js');
fs.writeFileSync(jsFile, js.replace(re, (m, a, b) => a + block + b));

// ---- dist/data.json
const json = rows.map((r) => ({code: r.code, name: r.name, phone: r.phone ? '+' + r.phone : ''}));
fs.writeFileSync(path.join(ROOT, 'dist/data.json'), '[\n' + json.map((r) => '  ' + JSON.stringify(r)).join(',\n') + '\n]\n');

console.log(rows.length + ' countries · CLDR ' + process.versions.cldr + ' · libphonenumber-js ' + require('libphonenumber-js/package.json').version
    + ' · embedded ' + Buffer.byteLength(block) + ' bytes · data.json ' + fs.statSync(path.join(ROOT, 'dist/data.json')).size + ' bytes');
