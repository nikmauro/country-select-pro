# CountrySelect Pro 🌍

[![CI](https://github.com/nikmauro/country-select-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/nikmauro/country-select-pro/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/country-select-pro)](https://www.npmjs.com/package/country-select-pro)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/country-select-pro/badge)](https://www.jsdelivr.com/package/npm/country-select-pro)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow)
![Size](https://img.shields.io/badge/gzip-~9KB-brightgreen)

A **lightweight, zero-dependency, vanilla JavaScript country selector** with flags, phone codes, search, keyboard and screen-reader support. Works with **Bootstrap 5** (including dark mode) or **without any framework**.

---

## ✨ Features

* 🚀 **Zero dependencies** – no jQuery, no framework.
* 🎨 **Bootstrap 5 or plain CSS** – themable with `--cs-*` CSS variables, follows Bootstrap's `--bs-*` variables (and `data-bs-theme="dark"`) automatically.
* 📋 **Any list** – built-in list of 250 countries, or your own: array, inline JSON, URL (ajax), or the `<option>`s of a `<select>`.
* 🔍 **Smart search** – accent-insensitive (`cote` → Côte…, `ελλαδα` → Ελλάδα), by name, ISO code or phone code, best matches first.
* 🌐 **Localized names** – country names in any language via `Intl.DisplayNames` (`data-lang="el"`).
* ♿ **Accessible** – ARIA combobox / listbox, full keyboard support, live result count, forced-colors and reduced-motion support.
* ⚡ **SEO & performance friendly** – progressive enhancement with `<select>`, the country list inside the script (no data request), lazy flags with fixed size (no layout shift), self-hosting option.
* 🧩 **Web Component** – `<country-select name="country" required>`: a real form field (value, validation, reset, label, disabled fieldset).
* 🪟 **Works in modals** – the list opens in the top layer (Popover API): not clipped by Bootstrap modals / offcanvas, `<dialog>` or `overflow: hidden`, and the modal's focus trap and <kbd>Esc</kbd> keep working.
* 🔁 **htmx ready** – auto-init on swapped / morphed / cloned content.

---

## 🎮 Live Demo

* **Demo, examples & settings playground:** https://nikmauro.github.io/country-select-pro/docs/
* **Standalone examples:** [htmx](https://nikmauro.github.io/country-select-pro/docs/examples/htmx.html) · [without a framework](https://nikmauro.github.io/country-select-pro/docs/examples/plain.html) · [`<select>`](https://nikmauro.github.io/country-select-pro/docs/examples/select.html) · [JavaScript API](https://nikmauro.github.io/country-select-pro/docs/examples/api.html)
* **What's new:** [CHANGELOG](CHANGELOG.md)

---

## 📦 Installation

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/country-select-pro@6.5.0/dist/country-select.min.js" defer></script>
```

The CSS is included in the script. For a strict **Content Security Policy** (no `'unsafe-inline'` styles) load the stylesheet instead – the script detects it and adds no `<style>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/country-select-pro@6.5.0/dist/country-select.min.css">
```

(The arrow is an SVG `data:` image: allow `img-src data:`; the flags come from `cdn.jsdelivr.net` unless you [self-host](#-seo--performance) them; the country list is inside the script.)

### npm

```bash
npm install country-select-pro
```

```javascript
import CountrySelect from 'country-select-pro';        // ES module (+ auto-init of .country-select)
import 'country-select-pro/css';                        // optional: CSS file instead of the injected <style>

const cs = new CountrySelect('#country', {preferredCountries: ['GR', 'CY']});
```

TypeScript types are included (`CountrySelectOptions`, `CountrySelectCountry`, `CountryItem`, the `country-change` event detail …). `require('country-select-pro')` works too.

| File | |
| --- | --- |
| `dist/country-select.js` / `.min.js` | Script (`<script>`, CommonJS) |
| `dist/country-select.mjs` | ES module |
| `dist/country-select.css` / `.min.css` | Stylesheet (optional) |
| `dist/country-select.d.ts` | TypeScript types |
| `dist/data.json`, `dist/flags/` | The built-in country list as JSON (for your own use), SVG flags |

---

## 🚀 Usage

Add the class `country-select` – that's it. The value of the input is the ISO code (or phone code / name, see `data-value-type`).

```html
<input type="text" class="country-select" name="country" value="GR">

<!-- phone code -->
<input type="text" class="country-select" name="phone_code" value="+30"
       data-value-type="phone" data-schema-return="{img} {phone}">
```

### Web Component `<country-select>`

A real form field: the value is submitted with its `name`, and `required`, form reset, `disabled` (also inside a disabled `<fieldset>`) and `<label for>` work natively – the browser's "please fill out this field" points at the visible control.

```html
<form>
  <label for="country">Country</label>
  <country-select id="country" name="country" value="GR" preferred="GR,CY" required></country-select>

  <country-select name="phone_code" value="+30" value-type="phone" schema-return="{img} {phone}" aria-label="Phone code"></country-select>
</form>
```

Attributes are the `data-*` options below without `data-` (`value-type`, `preferred`, `only-countries`, `lang`, `src`, `countries`, `popover` …). Properties: `el.value`, `el.country`, `el.instance` (the API below); events: `change`, `input`, `country-change`. Works with htmx swaps / morph; reserves its height before the script loads (no layout shift).

### Progressive enhancement with `<select>` (recommended for SEO / no-JS)

The list stays in your HTML: it works without JavaScript and the options are your own list.

```html
<select class="country-select" name="shipping_country" required>
  <option value="">Choose a country</option>
  <option value="GR">Greece</option>
  <option value="CY" selected>Cyprus</option>
  <option value="DE">Germany</option>
</select>
```

Optional per option: `data-code`, `data-phone`, `data-flag` (image URL). An empty option text takes the name from the built-in list.

### JavaScript

```javascript
const cs = new CountrySelect('#country', {
  defaultCountry: 'GR',
  preferredCountries: ['GR', 'CY'],
  lang: 'el'
});

cs.ready.then(() => console.log(cs.getCountry()));
```

Elements with the `country-select` class are initialized automatically; calling `new CountrySelect()` with options on such an element re-creates it with those options.

---

## ⚙️ Options

Every option can be set as a `data-*` attribute or as a JavaScript option (JS wins).

| Attribute | JS option | Default | Description |
| --- | --- | --- | --- |
| `data-value-type` | `valueType` | `code` | Value written to the input: `code` (ISO), `phone` (`+30`) or `name` |
| `data-schema` | `schema` | `{img} {name}` | Template of the list items: `{img}` `{name}` `{code}` `{phone}` |
| `data-schema-return` | `schemaReturn` | = schema | Template of the selected value |
| `data-preferred` | `preferredCountries` | – | Codes shown first, e.g. `"GR,CY"` |
| `data-only-countries` | `onlyCountries` | – | Show only these codes |
| `data-exclude-countries` | `excludeCountries` | – | Hide these codes |
| `data-default-country` | `defaultCountry` | – | ISO code selected when the input is empty |
| `data-placeholder` | `placeholder` | `Select` | Text when nothing is selected |
| `data-country-search` | `search` | `true` | Search box in the list |
| `data-search-placeholder` | `searchPlaceholder` | `Search...` | |
| `data-no-results` | `noResults` | `Not found` | |
| `data-country-row-values` | `rows` | `5` | Visible rows |
| `data-dropdown-width` | `dropdownWidth` | `auto` | e.g. `300px` |
| `data-popover` | `popover` | `true` | The list opens in the browser's top layer (Popover API): never clipped by modals, offcanvas or `overflow: hidden`, follows the control. `false` = inside the page (as ≤ 6.4) |
| `data-lang` | `lang` | – | Country names & texts language (`el`, `de`, … or `auto` = `<html lang>`) |
| `data-flags` | `flags` | `true` | `false` = no flags |
| `data-sort` | `sort` | `true` | `false` = keep the order of your list |
| `data-countries` | `countries` | – | Your list (see below) |
| `data-src` | `dataUrl` | – | URL of your list (JSON) |
| `data-base-url` | `baseUrl` | jsDelivr | Folder that contains `dist/flags/` (self-hosting the flags) |
| `data-flag-path` | `flagPath` | `{baseUrl}dist/flags/4x3/{code}.svg` | Flag URL template (`{code}` = `gr`, `{CODE}` = `GR`) |
| – | `fetchOptions` | – | `fetch()` options for `dataUrl` |
| – | `merge` | `true` | Fill missing names / phone codes of your list from the built-in list |

---

## 📋 Custom lists

```html
<!-- codes only: names, flags and phone codes come from the built-in list -->
<input class="country-select" data-countries='["GR","CY","IT"]'>

<!-- your own items -->
<input class="country-select" data-countries='[{"code":"GR","name":"Greece – 2 days"},{"value":"PICKUP","name":"Store pickup","flag":false}]'>

<!-- from your server (ajax) -->
<input class="country-select" data-src="/api/shipping-countries.json">
```

```javascript
new CountrySelect(el, {countries: () => fetch('/api/countries').then(r => r.json())});
cs.setCountries(['GR', 'CY']); // replace the list later
```

Accepted formats: an array of codes or objects, `{countries: [...]}`, `{data: [...]}`, `{"GR": "Greece", ...}` or the `dist/data.json` format. Item fields: `code` (`iso2`, `alpha2`), `name` (`label`, `text`), `phone` (`dial_code`), `flag` (URL or `false`), `value` (custom value), `keywords` (extra search words).

---

## 📡 Events & methods

```javascript
input.addEventListener('country-change', e => {
  console.log(e.detail.value, e.detail.country); // {code, name, localName, phone, value}
});
```

`change` and `input` are dispatched too, so `hx-trigger="change"` / `hx-trigger="country-change"` work.

| Method | |
| --- | --- |
| `CountrySelect.getInstance(el)` | Instance of an element |
| `CountrySelect.init(root)` | Initialize `.country-select` inside `root` |
| `cs.setValue('CY', {silent})` | Select by value (sends events unless `silent`) |
| `cs.getValue()` / `cs.getCountry()` | Current value / country |
| `cs.open()` / `cs.close()` / `cs.toggle()` | |
| `cs.setCountries(list)` | New list (array, function, JSON, URL) |
| `cs.refresh()` | Re-read the input value after `input.value = ...` |
| `cs.destroy()` | Remove the widget, restore the input |
| `cs.ready` | Promise, resolved when the list is loaded |

---

## 🎨 Styling

**Bootstrap 5:** nothing to do – colors, radius, focus ring and dark mode (`data-bs-theme="dark"`) follow Bootstrap's variables. Works inside `.input-group`, with `.is-invalid` and `.was-validated`.

**Without a framework:** set the `--cs-*` variables on any parent (or `:root`):

```css
.my-form {
  --cs-bg: #fff;  --cs-color: #222;  --cs-border-color: #ccc;  --cs-radius: 4px;
  --cs-active-bg: #e07a2f;  --cs-active-color: #fff;  --cs-hover-bg: #f3f3f3;
  --cs-focus-border: #e07a2f;  --cs-focus-ring: rgba(224, 122, 47, .3);
  /* also: --cs-font-size --cs-muted --cs-search-bg --cs-dropdown-bg --cs-dropdown-border-color
           --cs-divider-color --cs-invalid --cs-disabled-bg --cs-shadow --cs-z-index */
}
```

**Your own CSS only:** `window.CountrySelectConfig = {css: false}` before the script – class names: `.cs-wrapper .cs-trigger .cs-selected-content .cs-dropdown .cs-search-input .cs-list .cs-option(.active) .cs-divider`.

### Global configuration

```html
<script>window.CountrySelectConfig = {lang: 'el', preferredCountries: ['GR', 'CY'], baseUrl: '/vendor/country-select-pro/'};</script>
<script src=".../country-select.min.js" defer></script>
```

Any option can be a default here, plus `css: false` and `autoInit: false`.

---

## ♿ Accessibility

* ARIA 1.2 combobox / listbox pattern (`aria-expanded`, `aria-activedescendant`, `aria-selected`), label taken from `aria-label`, `aria-labelledby` or `<label for>`.
* Keyboard: <kbd>↓</kbd> <kbd>↑</kbd> <kbd>Enter</kbd> <kbd>Space</kbd> open, <kbd>Home</kbd> <kbd>End</kbd> <kbd>PgUp</kbd> <kbd>PgDn</kbd> move, typing a letter opens the search, <kbd>Esc</kbd> closes (without closing a surrounding modal), <kbd>Tab</kbd> leaves.
* Result count announced to screen readers, WCAG AA contrast, `forced-colors` (Windows high contrast) and `prefers-reduced-motion` support, disabled / readonly states.

## 🔎 SEO & performance

* Use a `<select>` (or an input with a value) – the content is in the HTML and works without JavaScript.
* The country list (~5 KB) is inside the script – no extra request, works offline.
* Flags are lazy-loaded, async-decoded and have a fixed size (no layout shift / CLS).
* Self-host the flags with `baseUrl` / `flagPath` to avoid third-party requests (or `data-flags="false"`).

---

## 🌐 Browser support

All modern browsers (Chrome, Edge, Firefox, Safari, iOS, Android). No polyfills required.

## 📂 Project structure

```
dist/
├─ country-select.js        source (also the unminified build)
├─ country-select.d.ts      TypeScript types
├─ country-select.min.js    ┐
├─ country-select.mjs       │ built by `npm run build`
├─ country-select.css       │ (published to npm, not in git)
├─ country-select.min.css   ┘
├─ data.json                the built-in country list as JSON (generated)
├─ data.LICENSE.md          sources and licenses of the country list
└─ flags/                   SVG flags (4x3, 1x1) – flag-icons, MIT
scripts/build-data.js       generates the country list (`npm run build:data`)
test/e2e/                   Playwright tests (`npm test`)
test/fixtures/              test pages
test/types-check.ts         TypeScript check (`npm run check:types`)
docs/index.html             live demo, examples, settings playground
docs/examples/              standalone examples (htmx, plain CSS, <select>, API)
CHANGELOG.md                release notes
```

## 🛠️ Development

```bash
npm install
npx playwright install          # once: Chromium, Firefox, WebKit
npm run build                   # min.js, .mjs, .css
npm test                        # all browsers + the minified build
npm run test:chromium           # quick
npm run check:types             # TypeScript types
npm run build:data              # regenerate the country list (CLDR + ITU, see dist/data.LICENSE.md)
```

**Releasing** – write the changes under `## [Unreleased]` in CHANGELOG.md, then:

```bash
npm version patch               # or minor / major: package.json, dist/country-select.js, README, CHANGELOG → commit + tag
git push --follow-tags          # GitHub Actions: tests → npm publish (provenance, no token) → GitHub Release
```

The tests (Playwright) cover keyboard and screen-reader behaviour (axe-core), search, values and events, custom lists, `<select>`, htmx swap / morph / clone, the CSS file under a strict CSP, the ES module and the built-in country list. They run on every push and pull request ([GitHub Actions](.github/workflows/ci.yml)).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch – `npm test` must pass
3. Submit a Pull Request

## 👨‍💻 Author

Developed by **Nikolaos Mavroeidis** – https://github.com/nikmauro

## 🙏 Credits

* **Flags:** [flag-icons](https://github.com/lipis/flag-icons) by Panayiotis Lipiridis – MIT ([`dist/flags/LICENSE`](dist/flags/LICENSE)).
* **Country names in other languages:** the browser's built-in [`Intl.DisplayNames`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames) (Unicode CLDR).
* **Country list:** ISO 3166-1 alpha-2 codes, English names from [Unicode CLDR](https://cldr.unicode.org/) (Unicode License V3), calling codes per ITU-T E.164 checked with [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js) (MIT) – generated by `npm run build:data`, see [`dist/data.LICENSE.md`](dist/data.LICENSE.md).

## 📄 License

MIT – free for personal and commercial projects. The flags keep their own MIT license (see Credits).
