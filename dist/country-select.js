/*! CountrySelect Pro v6.3.0 | MIT | https://github.com/nikmauro/country-select-pro */
/**
 * CountrySelect Pro v6.3.0
 * ---------------------------------------------------------------------------
 * Vanilla JS country selector — zero dependencies
 * - Bootstrap 5 ή χωρίς framework: θέμα με CSS μεταβλητές --cs-* (fallback στις --bs-*, άρα και dark mode του Bootstrap)
 * - Αυτόματο init σε <input> / <select> με class .country-select (στατικό HTML, htmx, MutationObserver)
 * - Λίστα: ενσωματωμένη (data.json) ή δική σου — array / function, JSON inline, URL (ajax), <option> ενός <select>
 * - Πληκτρολόγιο + ARIA combobox / listbox · αναζήτηση χωρίς τόνους, με κωδικό χώρας ή κλήσης
 * - Ονόματα χωρών σε κάθε γλώσσα (Intl.DisplayNames — data-lang="el")
 * - Builds: country-select.js (script / CommonJS) · .min.js · .mjs (import) · .css (χωρίς <style> από το JS) · .d.ts
 * Σημαίες: flag-icons (MIT © Panayiotis Lipiridis) — dist/flags/LICENSE
 * ---------------------------------------------------------------------------
 */
(function (global) {
    'use strict';

    if (typeof document === 'undefined') return;
    if (global.CountrySelect && global.CountrySelect.version) return; // ήδη φορτωμένο στη σελίδα — ένα αντίγραφο αρκεί

    const VERSION = '6.3.0';
    const DEFAULT_BASE_URL = 'https://cdn.jsdelivr.net/gh/nikmauro/country-select-pro@6.1.3/';

    /* ---------------------------------------------------------------- βοηθητικά */

    const I18N = {
        en: {placeholder: 'Select', searchPlaceholder: 'Search...', noResults: 'Not found', loading: 'Loading...', loadError: 'Could not load the list', results: '{n} results', listLabel: 'Countries'},
        el: {placeholder: 'Επιλέξτε', searchPlaceholder: 'Αναζήτηση...', noResults: 'Δεν βρέθηκε', loading: 'Φόρτωση...', loadError: 'Η λίστα δεν φορτώθηκε', results: '{n} αποτελέσματα', listLabel: 'Χώρες'}
    };

    // Κωδικός κλήσης κοινός σε πολλές χώρες → ποια εννοεί μια τιμή που είναι μόνο ο κωδικός (+1 = ΗΠΑ, όχι American Samoa)
    const PHONE_PRIMARY = {'+1': 'US', '+7': 'RU', '+44': 'GB', '+47': 'NO', '+61': 'AU', '+64': 'NZ', '+212': 'MA', '+262': 'RE', '+358': 'FI', '+500': 'FK', '+590': 'GP', '+599': 'CW', '+672': 'NF'};

    // Συνώνυμα για την αναζήτηση
    const ALIASES = {
        GB: 'uk britain england', US: 'usa america', GR: 'hellas ellada ελλαδα', CY: 'kypros κυπρος', AE: 'uae emirates', NL: 'holland',
        CZ: 'czech', KR: 'south korea', KP: 'north korea', DE: 'deutschland', ES: 'espana', CH: 'schweiz suisse', VA: 'vatican',
        CI: "cote d'ivoire", MK: 'macedonia', TR: 'turkey turkiye'
    };

    const ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E\")";

    const str = (v) => (v == null ? '' : String(v));
    const norm = (s) => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); // χωρίς τόνους / διακριτικά
    const esc = (s) => str(s).replace(/[&<>"']/g, (ch) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));
    const codeList = (v) => (Array.isArray(v) ? v : str(v).split(',')).map((c) => str(c).trim().toUpperCase()).filter(Boolean);
    const yes = (v, def) => (v == null || v === '' ? def : !(v === false || v === 'false' || v === '0' || v === 'no'));
    const phoneOf = (v) => { const d = str(v).replace(/\D/g, '').replace(/^00/, ''); return d ? '+' + d : ''; };
    const isFlagCode = (c) => /^[a-z]{2}(-[a-z]{2,4})?$/i.test(c);
    const slash = (u) => (u && !/\/$/.test(u) ? u + '/' : u);

    /* ---------------------------------------------------------------- δεδομένα */

    const jsonCache = {}; // url → Promise (ένα αίτημα ανά σελίδα, όσα instances κι αν υπάρχουν)

    function fetchJSON(url, init) {
        if (!jsonCache[url]) {
            jsonCache[url] = fetch(url, init)
                .then((res) => {
                    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
                    return res.json();
                })
                .catch((err) => {
                    delete jsonCache[url]; // να ξαναδοκιμάσει την επόμενη φορά
                    throw err;
                });
        }
        return jsonCache[url];
    }

    // Οποιαδήποτε μορφή λίστας → πίνακας: [...] · data.json της βιβλιοθήκης · {countries|items|data|results: [...]} · {"GR": "Greece"}
    function toArray(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.data && Array.isArray(data.data.objects)) return data.data.objects;
        for (const k of ['countries', 'items', 'data', 'results']) {
            if (Array.isArray(data[k])) return data[k];
        }
        if (typeof data === 'object') {
            return Object.keys(data).map((code) => (data[code] && typeof data[code] === 'object' ? Object.assign({code}, data[code]) : {code, name: data[code]}));
        }
        return [];
    }

    // Ένα στοιχείο σε οποιαδήποτε μορφή ("GR" · {code, name, phone, flag, value} · μορφή data.json · {iso2, dial_code} κ.λπ.)
    function toItem(x) {
        if (x == null || x === '') return null;
        if (typeof x !== 'object') x = {code: x};
        const cc = x.calling_codes || x.callingCodes;
        const name = str(x.name != null ? x.name : x.label != null ? x.label : x.text != null ? x.text : x.names && x.names.common).trim();
        const item = {
            code: str(x.code || x.iso2 || x.iso || x.alpha2 || (x.codes && x.codes.alpha_2)).trim().toUpperCase(),
            nameEn: name,
            fixedName: !!name && !(x.names && x.names.common), // όνομα από τον χρήστη → δεν μεταφράζεται
            phone: phoneOf(x.phone || x.dial_code || x.dialCode || (Array.isArray(cc) ? cc[0] : cc))
        };
        if (x.value != null && x.value !== '') item.value = str(x.value);
        if (typeof x.flag === 'string' || x.flag === false) item.flag = x.flag; // στο data.json το flag είναι {emoji} → αγνοείται
        const kw = x.keywords || x.aliases;
        if (kw) item.keywords = Array.isArray(kw) ? kw.join(' ') : str(kw);
        return item.code || item.value ? item : null;
    }

    /* ---------------------------------------------------------------- CSS */

    const CSS = `
.cs-wrapper { position: relative; display: block; width: 100%; font-family: inherit; text-align: start; outline: none; color: var(--cs-color, var(--bs-body-color, #212529)); }
.cs-wrapper, .cs-wrapper *, .cs-wrapper *::before, .cs-wrapper *::after { box-sizing: border-box; }
.cs-trigger {
    position: relative; display: flex; align-items: center; gap: 8px; cursor: pointer;
    min-height: calc(1.5em + .75rem + 2px); padding-block: .375rem; padding-inline: .75rem 2.25rem;
    font-size: var(--cs-font-size, 1rem); font-weight: 400; line-height: 1.5;
    color: var(--cs-color, var(--bs-body-color, #212529)); background-color: var(--cs-bg, var(--bs-body-bg, #fff)); background-clip: padding-box;
    border: 1px solid var(--cs-border-color, var(--bs-border-color, #ced4da)); border-radius: var(--cs-radius, var(--bs-border-radius, .375rem));
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}
.cs-trigger::after {
    content: ""; position: absolute; inset-inline-end: .75rem; top: 50%; width: 16px; height: 12px; margin-top: -6px; pointer-events: none;
    background-color: currentColor; -webkit-mask: ${ARROW} no-repeat center / 16px 12px; mask: ${ARROW} no-repeat center / 16px 12px;
    transition: transform .15s ease-in-out;
}
.cs-wrapper.open .cs-trigger::after { transform: rotate(180deg); }
.cs-wrapper:focus-within .cs-trigger {
    border-color: var(--cs-focus-border, #86b7fe); outline: 0;
    box-shadow: 0 0 0 .25rem var(--cs-focus-ring, var(--bs-focus-ring-color, rgba(13, 110, 253, .25)));
}
.cs-selected-content { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; white-space: nowrap; line-height: 1; }
.cs-selected-content.cs-placeholder { color: var(--cs-muted, var(--bs-secondary-color, #6c757d)); }

.input-group > .cs-wrapper { flex: 1 1 auto; width: 1%; min-width: 0; }
.input-group > .cs-wrapper:not(:last-child) .cs-trigger { border-start-end-radius: 0; border-end-end-radius: 0; }
.input-group > * + .country-select + .cs-wrapper .cs-trigger { border-start-start-radius: 0; border-end-start-radius: 0; }

.cs-wrapper.is-invalid .cs-trigger, .is-invalid + .cs-wrapper .cs-trigger, .was-validated :invalid + .cs-wrapper .cs-trigger {
    border-color: var(--cs-invalid, var(--bs-form-invalid-border-color, #dc3545)) !important;
}
.cs-error-msg { display: none; position: absolute; left: 0; top: 100%; width: 100%; z-index: 10; margin-top: 4px; font-size: .825em; color: var(--cs-invalid, var(--bs-form-invalid-color, #dc3545)); }
.cs-wrapper.is-invalid .cs-error-msg:not(:empty) { display: block; }
.cs-wrapper.cs-disabled .cs-trigger, :disabled + .cs-wrapper .cs-trigger { cursor: default; opacity: 1; background-color: var(--cs-disabled-bg, var(--bs-secondary-bg, #e9ecef)); }

.cs-dropdown {
    position: absolute; left: 0; right: 0; z-index: var(--cs-z-index, 2050); display: none; max-width: 95vw; margin-top: .125rem; overflow: hidden;
    color: var(--cs-color, var(--bs-body-color, #212529)); background: var(--cs-dropdown-bg, var(--cs-bg, var(--bs-body-bg, #fff)));
    border: 1px solid var(--cs-dropdown-border-color, var(--bs-border-color-translucent, rgba(0, 0, 0, .15)));
    border-radius: var(--cs-radius, var(--bs-border-radius, .375rem)); box-shadow: var(--cs-shadow, 0 .5rem 1rem rgba(0, 0, 0, .175));
}
.cs-wrapper.drop-up .cs-dropdown { bottom: calc(100% + .25rem); top: auto; box-shadow: var(--cs-shadow-up, 0 -.5rem 1rem rgba(0, 0, 0, .175)); }
.cs-wrapper.open .cs-dropdown { display: block; }

.cs-search-box { padding: 8px; background: var(--cs-search-bg, var(--bs-tertiary-bg, #f8f9fa)); border-bottom: 1px solid var(--cs-divider-color, var(--bs-border-color, #dee2e6)); }
.cs-search-input { font-size: .875rem; }
.cs-wrapper input.cs-search-input { /* πιο ισχυρό από γενικούς κανόνες του θέματος (input[type=text] { ... }) */
    display: block; width: 100%; height: auto; margin: 0; padding: .375rem .75rem; font-family: inherit; line-height: 1.5; outline: none;
    color: inherit; background: var(--cs-bg, var(--bs-body-bg, #fff)); box-shadow: none;
    border: 1px solid var(--cs-border-color, var(--bs-border-color, #ced4da)); border-radius: .25rem;
}
.cs-wrapper input.cs-search-input:focus { border-color: var(--cs-focus-border, #86b7fe); box-shadow: 0 0 0 .2rem var(--cs-focus-ring, var(--bs-focus-ring-color, rgba(13, 110, 253, .25))); }
@media (pointer: coarse) { .cs-search-input { font-size: 16px; } }

.cs-list { overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scroll-behavior: auto; min-height: 50px; padding: .375rem 0; }
.cs-option { display: flex; align-items: center; gap: 10px; padding: .5rem .75rem; font-size: .9rem; cursor: pointer; transition: background-color .1s; }
.cs-option:hover { background-color: var(--cs-hover-bg, var(--bs-tertiary-bg, #f8f9fa)); }
.cs-option[aria-selected="true"] { font-weight: 600; }
.cs-option.active { background-color: var(--cs-active-bg, var(--bs-primary, #0d6efd)); color: var(--cs-active-color, #fff); }
.cs-divider { height: 1px; margin: .375rem 0; pointer-events: none; background: var(--cs-divider-color, var(--bs-border-color, #dee2e6)); }
.cs-no-results, .cs-loading, .cs-load-error { padding: 10px; text-align: center; font-style: italic; cursor: default; color: var(--cs-muted, var(--bs-secondary-color, #6c757d)); }
.cs-load-error { color: var(--cs-invalid, var(--bs-form-invalid-color, #dc3545)); }

.cs-flag-img { display: inline-block; width: 22px !important; height: 16px !important; object-fit: cover; vertical-align: middle; margin-inline-end: 8px; border-radius: 2px; }
.cs-wrapper img { width: 20px !important; height: 14px !important; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
.cs-hidden { display: none !important; }
.cs-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }

@media (prefers-reduced-motion: reduce) { .cs-trigger, .cs-trigger::after, .cs-option { transition: none; } }
@media (forced-colors: active) {
    .cs-trigger::after { forced-color-adjust: none; background-color: CanvasText; }
    .cs-option.active { forced-color-adjust: none; background-color: Highlight; color: HighlightText; }
}
`;

    function injectStyles() {
        if (CountrySelect.defaults.css === false || document.getElementById('cs-styles')) return;
        // Φορτωμένο το dist/country-select.css (π.χ. για αυστηρό CSP) → όχι <style> από το JS
        if (getComputedStyle(document.documentElement).getPropertyValue('--cs-css').trim()) return;
        const style = document.createElement('style');
        style.id = 'cs-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* ---------------------------------------------------------------- instances */

    const instances = new Set();
    let uid = 0;
    let globalBound = false;

    function bindGlobal() {
        if (globalBound) return;
        globalBound = true;
        document.addEventListener('click', (e) => {
            instances.forEach((inst) => {
                if (!inst.input.isConnected) return inst.destroy(); // βγήκε από τη σελίδα (htmx swap κ.λπ.) → καθάρισμα
                if (inst.isOpen && !inst.wrapper.contains(e.target)) inst.close();
            });
        });
    }

    class CountrySelect {

        /**
         * @param {HTMLInputElement|HTMLSelectElement|string} element  input / select ή CSS selector
         * @param {Object} [options]  υπερισχύουν των data-* (βλ. README)
         */
        constructor(element, options) {
            const o = options || {};
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            this.input = el;
            if (!el || !el.parentNode) {
                if (typeof element === 'string' && !el) console.warn('CountrySelect: element not found:', element);
                return;
            }

            // Ήδη ενεργό στο ίδιο στοιχείο → το ίδιο instance (με νέες options: ξανά από την αρχή με αυτές)
            if (CountrySelect._isLive(el)) {
                if (!Object.keys(o).length) return el._countrySelect;
                el._countrySelect.destroy();
            }
            // Παλιό instance που έχασε το wrapper του (π.χ. morph του htmx) ή αντίγραφο HTML (cloneNode, ιστορικό htmx) → καθάρισμα και ξανά
            if (el._countrySelect) el._countrySelect.destroy();
            const stale = el.nextElementSibling;
            if (stale && stale.classList.contains('cs-wrapper')) stale.remove();

            el._countrySelect = this;
            el.dataset.csInitialized = '1';
            instances.add(this);

            const d = el.dataset;
            const defs = CountrySelect.defaults;
            const pick = (key, dataKey) => (o[key] !== undefined ? o[key] : d[dataKey || key] !== undefined ? d[dataKey || key] : defs[key]);

            this.options = o;
            this._id = 'cs' + (++uid);
            this._off = [];
            this.isSelect = el.tagName === 'SELECT';

            // Ρυθμίσεις: options > data-* > CountrySelect.defaults (window.CountrySelectConfig) > προεπιλογές
            this.schema = pick('schema') || '{img} {name}';
            this.schemaReturn = pick('schemaReturn') || this.schema;
            this.valueType = pick('valueType') || 'code';
            this.rowLimit = parseInt(pick('rows', 'countryRowValues'), 10) || 5;
            this.hasSearch = yes(pick('search', 'countrySearch'), true);
            this.dropdownWidth = pick('dropdownWidth') || 'auto';
            this.preferredCodes = codeList(pick('preferredCountries', 'preferred'));
            this.onlyCodes = codeList(pick('onlyCountries'));
            this.excludeCodes = codeList(pick('excludeCountries'));
            this.defaultCountry = str(pick('defaultCountry')).trim();
            this.sort = yes(pick('sort'), true);
            this.showFlags = yes(pick('flags'), true);
            let lang = str(pick('lang'));
            if (lang === 'auto') lang = document.documentElement.lang || navigator.language || '';
            this.lang = lang;
            this.baseUrl = slash(pick('baseUrl') || CountrySelect.baseUrl);
            this.flagPath = pick('flagPath') || this.baseUrl + 'dist/flags/4x3/{code}.svg';
            this.source = pick('countries') != null ? pick('countries') : pick('dataUrl', 'src');

            const t = I18N[lang.slice(0, 2).toLowerCase()] || I18N.en;
            const emptyOption = this.isSelect ? Array.from(el.options).find((op) => op.value === '') : null;
            this.config = Object.assign({}, t, {
                placeholder: d.placeholder || defs.placeholder || (emptyOption && emptyOption.text.trim()) || t.placeholder,
                searchPlaceholder: d.searchPlaceholder || defs.searchPlaceholder || t.searchPlaceholder,
                noResults: d.noResults || defs.noResults || t.noResults
            }, o);

            this.countries = [];
            this.filteredCountries = [];
            this.ordered = [];          // όπως φαίνεται στη λίστα: προτιμώμενες πρώτα, μετά οι υπόλοιπες
            this._els = [];             // τα .cs-option, ίδια σειρά με το ordered
            this.selected = null;
            this.isOpen = false;
            this.activeIndex = -1;
            this.rowHeight = 44;

            /** Promise — ολοκληρώνεται όταν φορτώσει η λίστα */
            this.ready = this._init();
        }

        static _isLive(el) {
            const inst = el && el._countrySelect;
            return !!(inst && !inst._destroyed && el.dataset.csInitialized === '1' && inst.wrapper && inst.wrapper.isConnected);
        }

        async _init() {
            injectStyles();
            this._setupDOM();
            this._bindEvents();
            await this._loadData();
            return this;
        }

        /* ------------------------------------------------------------ DOM */

        _setupDOM() {
            const el = this.input, id = this._id, c = this.config;
            this._orig = {style: el.getAttribute('style'), tabindex: el.getAttribute('tabindex')};

            Object.assign(el.style, {position: 'absolute', opacity: '0', width: '1px', height: '1px', pointerEvents: 'none'});
            el.tabIndex = -1; // στο Tab πηγαίνει μόνο στο ορατό control

            const w = this.wrapper = document.createElement('div');
            w.className = 'cs-wrapper';
            w.tabIndex = 0;
            w.setAttribute('role', 'combobox');
            w.setAttribute('aria-haspopup', 'listbox');
            w.setAttribute('aria-expanded', 'false');
            w.setAttribute('aria-controls', id + '-list');
            const labelledBy = el.getAttribute('aria-labelledby');
            const label = el.getAttribute('aria-label') || (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : '');
            if (labelledBy) w.setAttribute('aria-labelledby', labelledBy);
            else if (label) w.setAttribute('aria-label', label);
            if (el.getAttribute('aria-describedby')) w.setAttribute('aria-describedby', el.getAttribute('aria-describedby'));
            if (el.required) w.setAttribute('aria-required', 'true');

            w.innerHTML =
                '<div class="cs-trigger"><span class="cs-selected-content"></span></div>' +
                '<div class="cs-error-msg"></div>' +
                '<div class="cs-dropdown">' +
                '<div class="cs-search-box' + (this.hasSearch ? '' : ' cs-hidden') + '">' +
                '<input type="text" class="cs-search-input" autocomplete="off" autocapitalize="off" spellcheck="false" tabindex="-1" aria-autocomplete="list">' +
                '</div>' +
                '<div class="cs-list" role="listbox" id="' + id + '-list"><div class="cs-loading">' + esc(c.loading) + '</div></div>' +
                '</div>' +
                '<div class="cs-sr-only" aria-live="polite"></div>';

            this.contentEl = w.querySelector('.cs-selected-content');
            this.dropdownEl = w.querySelector('.cs-dropdown');
            this.searchEl = w.querySelector('.cs-search-input');
            this.listEl = w.querySelector('.cs-list');
            this.liveEl = w.querySelector('.cs-sr-only');

            this.searchEl.placeholder = c.searchPlaceholder;
            this.searchEl.setAttribute('aria-label', c.searchPlaceholder);
            this.searchEl.setAttribute('aria-controls', id + '-list');
            this.listEl.setAttribute('aria-label', label || c.listLabel);
            this.dropdownEl.style.width = this.dropdownWidth === 'auto' ? '100%' : this.dropdownWidth;
            if (!el.value) this._showPlaceholder();

            el.parentNode.insertBefore(w, el.nextSibling);
            if (document.activeElement === el) w.focus({preventScroll: true}); // autofocus
            this._syncDisabled();
        }

        _bindEvents() {
            const w = this.wrapper, el = this.input;
            const on = (target, type, fn) => {
                target.addEventListener(type, fn);
                this._off.push(() => target.removeEventListener(type, fn));
            };

            on(w.querySelector('.cs-trigger'), 'click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
            on(w, 'keydown', (e) => this._onKey(e));
            on(this.searchEl, 'input', () => this._onSearch());
            on(this.listEl, 'click', (e) => {
                const opt = e.target.closest('.cs-option');
                if (!opt) return;
                e.stopPropagation();
                const country = this.ordered[+opt.dataset.index];
                if (country) this._choose(country);
            });

            // Αλλαγή της τιμής απ' έξω (autofill, άλλο script που στέλνει change) → ενημέρωση του control
            const external = () => {
                if (!this._emitting) this._syncFromInput();
            };
            on(el, 'change', external);
            on(el, 'input', external);
            on(el, 'invalid', () => {
                w.classList.add('is-invalid');
                w.setAttribute('aria-invalid', 'true');
            });
            if (el.form) on(el.form, 'reset', () => setTimeout(() => {
                w.classList.remove('is-invalid');
                w.removeAttribute('aria-invalid');
                this._syncFromInput();
            }, 0));
            // <label for> → εστίαση στο ορατό control (όχι στο κρυφό input)
            Array.from(el.labels || []).forEach((lab) => on(lab, 'click', (e) => {
                if (w.contains(e.target)) return;
                e.preventDefault();
                if (!this._isDisabled()) w.focus();
            }));

            this._mo = new MutationObserver((muts) => {
                this._syncDisabled();
                if (this.isSelect && muts.some((m) => m.type === 'childList')) this._loadData(); // άλλαξαν τα <option>
            });
            this._mo.observe(el, {attributes: true, attributeFilter: ['disabled', 'readonly'], childList: this.isSelect});

            bindGlobal();
        }

        /* ------------------------------------------------------------ δεδομένα */

        async _loadData() {
            const token = (this._loadToken = (this._loadToken || 0) + 1);
            try {
                const items = await this._getItems();
                if (token !== this._loadToken || this._destroyed) return;
                this.close();
                this._build(items);
                if (!this.input.value && this.defaultCountry) {
                    const dc = this.defaultCountry;
                    const c = this.countries.find((x) => x.code === dc.toUpperCase()) || this._find(dc);
                    if (c) this.input.value = this._valueOf(c);
                }
                this._renderOptions();
                this._syncFromInput();
            } catch (err) {
                console.error('CountrySelect Load Fail:', err);
                if (!this._destroyed) this.listEl.innerHTML = '<div class="cs-load-error">' + esc(this.config.loadError) + '</div>';
            }
        }

        _base() {
            return fetchJSON(this.baseUrl + 'dist/data.json').then((json) => toArray(json).map(toItem).filter((it) => it && it.code));
        }

        async _getItems() {
            let custom = null;
            let src = this.source;
            if (this.isSelect) {
                custom = Array.from(this.input.options).filter((op) => op.value !== '').map((op) => ({
                    value: op.value,
                    code: op.dataset.code || (this.valueType === 'code' ? op.value : ''),
                    phone: op.dataset.phone || (this.valueType === 'phone' ? op.value : ''),
                    name: op.text.trim(),
                    flag: op.dataset.flag
                }));
            } else if (src != null && src !== '') {
                if (typeof src === 'function') src = await src();
                if (typeof src === 'string') {
                    const s = src.trim();
                    src = s[0] === '[' || s[0] === '{' ? JSON.parse(s) : await fetchJSON(s, this.options.fetchOptions);
                }
                custom = toArray(await src);
            }

            if (!custom) return (await this._base()).map((it) => Object.assign({}, it));

            const items = custom.map(toItem).filter(Boolean);
            // Ό,τι λείπει (όνομα / κωδικός κλήσης) από την ενσωματωμένη λίστα — μόνο όταν χρειάζεται
            const needPhone = this.valueType === 'phone' || /\{phone\}/.test(this.schema + this.schemaReturn);
            if (yes(this.options.merge, true) && items.some((it) => it.code && (!it.nameEn || (needPhone && !it.phone)))) {
                const base = await this._base().catch(() => []);
                const map = {};
                base.forEach((b) => { map[b.code] = b; });
                items.forEach((it) => {
                    const b = map[it.code];
                    if (!b) return;
                    if (!it.nameEn) it.nameEn = b.nameEn;
                    if (!it.phone) it.phone = b.phone;
                });
            }
            items.forEach((it) => {
                if (!it.nameEn) it.nameEn = it.code || it.value;
            });
            return items;
        }

        _build(items) {
            let names = null, collator = null;
            if (this.lang) {
                try { names = new Intl.DisplayNames([this.lang], {type: 'region', fallback: 'none'}); } catch (e) { /* χωρίς μετάφραση */ }
                try { collator = new Intl.Collator(this.lang); } catch (e) { /* default */ }
            }
            const only = this.onlyCodes, excl = this.excludeCodes, pref = this.preferredCodes;
            let list = items
                .filter((it) => (!only.length || only.includes(it.code)) && !excl.includes(it.code))
                .map((it) => {
                    let name = it.nameEn;
                    if (names && it.code && !it.fixedName) {
                        try { name = names.of(it.code) || name; } catch (e) { /* άγνωστος κωδικός */ }
                    }
                    let flag = '';
                    if (this.showFlags && it.flag !== false) {
                        flag = typeof it.flag === 'string' ? it.flag
                            : isFlagCode(it.code) ? this.flagPath.split('{code}').join(it.code.toLowerCase()).split('{CODE}').join(it.code) : '';
                    }
                    return {
                        code: it.code, name, nameEn: it.nameEn, phone: it.phone || '', flag, value: it.value,
                        isPreferred: !!it.code && pref.includes(it.code),
                        _search: norm([name, it.nameEn, it.code, ALIASES[it.code], it.keywords].join(' '))
                    };
                });
            if (this.sort) list.sort((a, b) => (collator ? collator.compare(a.name, b.name) : a.name.localeCompare(b.name)));
            this.countries = list;
            this.filteredCountries = list.slice();
            this._filtered = false;
        }

        /** Τιμή του input για μια χώρα */
        _valueOf(c) {
            if (c.value != null) return c.value;
            return this.valueType === 'phone' ? c.phone : this.valueType === 'name' ? c.nameEn : c.code;
        }

        /** Χώρα από τιμή (κωδικός ISO χωρίς διάκριση πεζών / κεφαλαίων, κωδικός κλήσης, όνομα) */
        _find(val) {
            const v = str(val).trim();
            if (!v) return null;
            const list = this.countries, sel = this.selected;
            if (sel && this._valueOf(sel) === v) return sel; // π.χ. +1: μένει ο Καναδάς αν επιλέχθηκε ο Καναδάς
            const exact = list.find((c) => c.value != null && c.value === v);
            if (exact) return exact;

            if (this.valueType === 'phone') {
                const p = phoneOf(v);
                const hits = list.filter((c) => c.phone === p);
                if (hits.length < 2) return hits[0] || null;
                for (const code of this.preferredCodes) {
                    const h = hits.find((c) => c.code === code);
                    if (h) return h;
                }
                return hits.find((c) => c.code === PHONE_PRIMARY[p]) || hits[0];
            }
            if (this.valueType === 'name') {
                const n = norm(v);
                return list.find((c) => norm(c.nameEn) === n || norm(c.name) === n) || null;
            }
            const up = v.toUpperCase();
            return list.find((c) => c.code === up) || list.find((c) => c.value != null && c.value.toUpperCase() === up) || null;
        }

        /* ------------------------------------------------------------ εμφάνιση */

        _parseTemplate(template, c) {
            const img = c.flag
                ? '<img src="' + esc(c.flag) + '" class="cs-flag-img" width="20" height="14" loading="lazy" decoding="async" alt="' + (template.indexOf('{name}') > -1 ? '' : esc(c.name)) + '">'
                : '';
            return template
                .split('{img}').join(img)
                .split('{name}').join('<span>' + esc(c.name) + '</span>')
                .split('{code}').join('<span>' + esc(c.code) + '</span>')
                .split('{phone}').join('<span>' + esc(c.phone) + '</span>');
        }

        _showPlaceholder() {
            this.contentEl.classList.add('cs-placeholder');
            this.contentEl.innerHTML = this.config.placeholder;
        }

        _setSelected(c) {
            this.selected = c || null;
            if (c) {
                this.contentEl.classList.remove('cs-placeholder');
                this.contentEl.innerHTML = this._parseTemplate(this.schemaReturn, c);
            } else {
                this._showPlaceholder();
            }
            this._els.forEach((node, i) => node.setAttribute('aria-selected', this.ordered[i] === this.selected ? 'true' : 'false'));
        }

        _syncFromInput() {
            if (this.countries.length) this._setSelected(this._find(this.input.value));
        }

        _renderOptions() {
            const list = this.listEl;
            const pref = [], rest = [];
            this.filteredCountries.forEach((c) => (c.isPreferred ? pref : rest).push(c));
            this.ordered = pref.concat(rest);
            this._els = [];
            list.textContent = '';

            if (!this.ordered.length) {
                list.innerHTML = '<div class="cs-no-results"><span class="cs-no-results-text">' + esc(this.config.noResults) + '</span></div>';
                return;
            }

            const frag = document.createDocumentFragment();
            const searching = !!this.searchEl.value.trim();
            this.ordered.forEach((c, i) => {
                if (i === pref.length && i > 0 && !searching) {
                    const hr = document.createElement('div');
                    hr.className = 'cs-divider';
                    hr.setAttribute('aria-hidden', 'true');
                    frag.appendChild(hr);
                }
                const div = document.createElement('div');
                div.className = 'cs-option' + (i === this.activeIndex ? ' active' : '');
                div.id = this._id + '-o' + i;
                div.setAttribute('role', 'option');
                div.setAttribute('aria-selected', c === this.selected ? 'true' : 'false');
                div.dataset.index = i;
                div.innerHTML = this._parseTemplate(this.schema, c);
                frag.appendChild(div);
                this._els.push(div);
            });
            list.appendChild(frag);
        }

        _updateActive() {
            this._els.forEach((node, i) => node.classList.toggle('active', i === this.activeIndex));
            const node = this.isOpen ? this._els[this.activeIndex] : null;
            [this.wrapper, this.searchEl].forEach((t) => (node ? t.setAttribute('aria-activedescendant', node.id) : t.removeAttribute('aria-activedescendant')));
        }

        _updatePosition() {
            const rect = this.wrapper.getBoundingClientRect();
            const dropdownHeight = (this.rowLimit * this.rowHeight) + (this.hasSearch ? 60 : 0);
            const spaceBelow = window.innerHeight - rect.bottom;
            this.wrapper.classList.toggle('drop-up', spaceBelow < dropdownHeight && rect.top > dropdownHeight);
        }

        _itemTop(item) {
            return item.getBoundingClientRect().top - this.listEl.getBoundingClientRect().top + this.listEl.scrollTop;
        }

        /**
         * Άνοιγμα: αν η επιλεγμένη φαίνεται ήδη από την αρχή της λίστας, η λίστα ξεκινά από την αρχή (6.1.4)·
         * αλλιώς η επιλεγμένη στη μέση.
         */
        _scrollToActive() {
            const list = this.listEl, item = this._els[this.activeIndex];
            if (!item) {
                list.scrollTop = 0;
                return;
            }
            const top = this._itemTop(item);
            list.scrollTop = top + item.offsetHeight <= list.clientHeight ? 0 : top - (list.clientHeight / 2) + (item.offsetHeight / 2);
        }

        /** Πληκτρολόγιο: όσο scroll χρειάζεται για να φαίνεται η ενεργή */
        _scrollNearest() {
            const list = this.listEl, item = this._els[this.activeIndex];
            if (!item) return;
            if (this.activeIndex === 0) return void (list.scrollTop = 0);
            if (this.activeIndex === this._els.length - 1) return void (list.scrollTop = list.scrollHeight);
            const top = this._itemTop(item), bottom = top + item.offsetHeight;
            if (top < list.scrollTop) list.scrollTop = top;
            else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
        }

        _announce(msg) {
            clearTimeout(this._liveTimer);
            this._liveTimer = setTimeout(() => {
                this.liveEl.textContent = msg;
            }, 400);
        }

        /* ------------------------------------------------------------ αλληλεπίδραση */

        _isDisabled() {
            return this.input.disabled || this.input.matches(':disabled');
        }

        _syncDisabled() {
            const dis = this._isDisabled(), w = this.wrapper;
            if (!w) return;
            w.classList.toggle('cs-disabled', dis);
            w.tabIndex = dis ? -1 : 0;
            if (dis) w.setAttribute('aria-disabled', 'true'); else w.removeAttribute('aria-disabled');
            if (this.input.readOnly) w.setAttribute('aria-readonly', 'true'); else w.removeAttribute('aria-readonly');
            if (dis) this.close();
        }

        _onSearch() {
            const raw = this.searchEl.value.trim();
            const term = norm(raw);
            let res = this.countries;
            if (term) {
                const isPhone = /^\+?[\d\s().-]*$/.test(raw);
                const digits = raw.replace(/\D/g, '');
                const primary = PHONE_PRIMARY['+' + digits];
                const rank = isPhone
                    ? (c) => (!c.phone || c.phone.indexOf(digits) < 0 ? -1 : c.phone === '+' + digits ? (c.code === primary ? 0 : 1) : c.phone.indexOf('+' + digits) === 0 ? 2 : 3)
                    : (c) => {
                        const s = ' ' + c._search + ' ';
                        return s.indexOf(term) < 0 ? -1 : s.indexOf(' ' + term + ' ') > -1 ? 0 : s.indexOf(' ' + term) > -1 ? 1 : 2;
                    };
                // ακριβής λέξη / κωδικός → ξεκινά από τον όρο → τον περιέχει (με την αλφαβητική σειρά μέσα σε κάθε ομάδα)
                res = res.map((c, i) => [rank(c), i, c]).filter((x) => x[0] > -1).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
            }
            this.filteredCountries = res === this.countries ? res.slice() : res;
            this._filtered = !!term;
            this.activeIndex = res.length ? 0 : -1;
            this._renderOptions();
            this.listEl.scrollTop = 0;
            this._updateActive();
            this._announce(term ? this.config.results.replace('{n}', res.length) : '');
        }

        _move(i) {
            if (i < 0 || i >= this.ordered.length) return;
            this.activeIndex = i;
            this._updateActive();
            this._scrollNearest();
        }

        _onKey(e) {
            if (e.isComposing || e.keyCode === 229) return; // IME (π.χ. σύνθεση χαρακτήρων)
            if (this._isDisabled() || this.input.readOnly) return;
            const k = e.key, inSearch = e.target === this.searchEl;
            const printable = k.length === 1 && k !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey;

            if (!this.isOpen) {
                if (e.target !== this.wrapper) return;
                if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].indexOf(k) > -1) {
                    e.preventDefault();
                    this.open();
                    if (k === 'Home') this._move(0);
                    else if (k === 'End') this._move(this.ordered.length - 1);
                } else if (printable && this.hasSearch) {
                    this.open(); // η εστίαση πάει στην αναζήτηση → ο χαρακτήρας γράφεται εκεί
                }
                return;
            }

            const last = this.ordered.length - 1;
            switch (k) {
                case 'ArrowDown':
                    e.preventDefault();
                    this._move(Math.min(this.activeIndex + 1, last));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this._move(Math.max(this.activeIndex - 1, 0));
                    break;
                case 'PageDown':
                    e.preventDefault();
                    this._move(Math.min(this.activeIndex + this.rowLimit, last));
                    break;
                case 'PageUp':
                    e.preventDefault();
                    this._move(Math.max(this.activeIndex - this.rowLimit, 0));
                    break;
                case 'Home':
                case 'End':
                    if (inSearch) break; // μέσα στην αναζήτηση: κέρσορας
                    e.preventDefault();
                    this._move(k === 'Home' ? 0 : last);
                    break;
                case ' ':
                    if (inSearch) break;
                    // falls through
                case 'Enter':
                    e.preventDefault();
                    if (this.ordered[this.activeIndex]) this._choose(this.ordered[this.activeIndex]);
                    break;
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation(); // να μην κλείσει και το modal / offcanvas γύρω
                    this.close(true);
                    break;
                case 'Tab':
                    this.close();
                    break;
                default:
                    if (printable && this.hasSearch && !inSearch) this.searchEl.focus();
            }
        }

        _apply(c, silent) {
            this.input.value = c ? this._valueOf(c) : '';
            this._setSelected(c);
            this.input.setCustomValidity('');
            this.wrapper.classList.remove('is-invalid');
            this.wrapper.removeAttribute('aria-invalid');
            if (!silent) this._emit();
        }

        _choose(c) {
            this._apply(c);
            this.close(true);
        }

        _emit() {
            const el = this.input;
            this._emitting = true;
            try {
                el.dispatchEvent(new Event('change', {bubbles: true}));
                el.dispatchEvent(new Event('input', {bubbles: true}));
                // Μοναδικό event για htmx (hx-trigger="country-change") με τα στοιχεία της χώρας
                el.dispatchEvent(new CustomEvent('country-change', {bubbles: true, detail: {value: el.value, country: this.getCountry()}}));
            } finally {
                this._emitting = false;
            }
        }

        /* ------------------------------------------------------------ δημόσιο API */

        open() {
            if (this.isOpen || this._destroyed || !this.countries.length || this._isDisabled() || this.input.readOnly) return;
            instances.forEach((inst) => {
                if (inst !== this && inst.isOpen) inst.close();
            });
            document.dispatchEvent(new CustomEvent('cs-close-others', {detail: {opener: this.wrapper}}));

            if (this._filtered || this.searchEl.value) { // νέο άνοιγμα → χωρίς την προηγούμενη αναζήτηση
                this.searchEl.value = '';
                this.filteredCountries = this.countries.slice();
                this._filtered = false;
                this._renderOptions();
            }
            this._updatePosition();
            this.listEl.style.maxHeight = (this.rowLimit * this.rowHeight) + 'px';
            this.isOpen = true;
            this.wrapper.classList.add('open');
            this.wrapper.setAttribute('aria-expanded', 'true');
            this.activeIndex = this.selected ? this.ordered.indexOf(this.selected) : -1;
            this._updateActive();
            this._scrollToActive();
            if (this.hasSearch) this.searchEl.focus({preventScroll: true});
        }

        close(refocus) {
            if (!this.isOpen) return;
            this.isOpen = false;
            this.wrapper.classList.remove('open');
            this.wrapper.setAttribute('aria-expanded', 'false');
            this._updateActive();
            if (refocus) this.wrapper.focus({preventScroll: true});
        }

        toggle() {
            if (this.isOpen) this.close(true); else this.open();
        }

        /** Συμβατότητα με ≤ 6.1 */
        _toggle(force) {
            if (force === undefined) this.toggle(); else if (force) this.open(); else this.close();
        }

        /**
         * Ορισμός τιμής (κωδικός / κωδικός κλήσης / όνομα, ανάλογα με το valueType).
         * Στέλνει change / input / country-change, εκτός αν {silent: true}.
         */
        setValue(value, opts) {
            if (!this.countries.length) { // δεν έχει φορτώσει ακόμα → εφαρμόζεται με το φόρτωμα
                this.input.value = str(value);
                return this;
            }
            this._apply(this._find(value), !!(opts && opts.silent));
            return this;
        }

        getValue() {
            return this.input.value;
        }

        /** {code, name, localName, phone, value} ή null */
        getCountry() {
            const c = this.selected;
            return c ? {code: c.code, name: c.nameEn, localName: c.name, phone: c.phone, value: this._valueOf(c)} : null;
        }

        /** Νέα λίστα (array, function, JSON, URL) */
        setCountries(source) {
            this.source = source;
            return this._loadData();
        }

        /** Ξανά από την τιμή του input (μετά από input.value = ... χωρίς event) */
        refresh() {
            this._syncFromInput();
            return this;
        }

        destroy() {
            if (this._destroyed) return;
            this.close();
            this._destroyed = true;
            this._off.forEach((off) => off());
            this._off = [];
            if (this._mo) this._mo.disconnect();
            clearTimeout(this._liveTimer);
            instances.delete(this);
            if (this.wrapper && this.wrapper.parentNode) this.wrapper.remove();
            const el = this.input;
            if (el._countrySelect === this) delete el._countrySelect;
            delete el.dataset.csInitialized;
            if (this._orig) {
                if (this._orig.style == null) el.removeAttribute('style'); else el.style.cssText = this._orig.style; // cssText: επιτρέπεται και με αυστηρό CSP
                if (this._orig.tabindex == null) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', this._orig.tabindex);
            }
        }
    }

    CountrySelect.version = VERSION;
    CountrySelect.baseUrl = DEFAULT_BASE_URL;
    /** Καθολικές ρυθμίσεις: window.CountrySelectConfig = {...} ΠΡΙΝ φορτωθεί το script (π.χ. {css: false, lang: 'el', baseUrl, flagPath}) */
    CountrySelect.defaults = Object.assign({}, global.CountrySelectConfig);
    if (CountrySelect.defaults.baseUrl) CountrySelect.baseUrl = CountrySelect.defaults.baseUrl;

    /* ---------------------------------------------------------------- AUTO-INIT (στατικό HTML, htmx, δυναμικό DOM) */

    const initCS = (target) => {
        const root = target && target.querySelectorAll ? target : document;
        const els = [];
        if (root.matches && root.matches('.country-select')) els.push(root);
        root.querySelectorAll('.country-select').forEach((el) => els.push(el));
        els.forEach((el) => {
            if ((el.tagName === 'INPUT' || el.tagName === 'SELECT') && !CountrySelect._isLive(el)) new CountrySelect(el);
        });
    };

    CountrySelect.init = initCS;
    CountrySelect.getInstance = (el) => {
        const node = typeof el === 'string' ? document.querySelector(el) : el;
        return node && CountrySelect._isLive(node) ? node._countrySelect : null;
    };

    function setup() {
        initCS(document);
        document.addEventListener('htmx:afterSettle', (e) => initCS((e.detail && e.detail.target) || e.target));
        new MutationObserver((mutations) => {
            mutations.forEach((mu) => mu.addedNodes.forEach((node) => {
                if (node.nodeType !== 1 || node.closest('.cs-wrapper')) return; // τα δικά μας (επιλογές της λίστας κ.λπ.)
                initCS(node);
            }));
        }).observe(document.documentElement, {childList: true, subtree: true});
    }

    global.CountrySelect = CountrySelect;
    if (!global.initCS) global.initCS = initCS; // ≤ 6.1: global συνάρτηση
    if (typeof module === 'object' && module.exports) module.exports = CountrySelect;

    if (CountrySelect.defaults.autoInit !== false) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
        else setup();
    }
})(typeof window !== 'undefined' ? window : this);
