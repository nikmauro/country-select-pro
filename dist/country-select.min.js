/**
 * CountrySelect Pro v5.7
 * ---------------------------------------------------------------------------
 * Features: 
 * - SVG Arrow Down icon
 * - HTMX Auto-initialization
 * - Improved Validation UI
 * - Zero Dependencies
 * ---------------------------------------------------------------------------
 */

class CountrySelect {
    constructor(element, options = {}) {
        this.input = element;
        if (!this.input) return;

        // Configuration
        this.schema = this.input.dataset.schema || "{img} {name}";
        this.schemaReturn = this.input.dataset.schemaReturn || this.schema;
        this.valueType = this.input.dataset.valueType || "code"; 
        this.rowLimit = parseInt(this.input.dataset.countryRowValues) || 5; 
        this.hasSearch = this.input.dataset.countrySearch !== "false";
        this.dropdownWidth = this.input.dataset.dropdownWidth || "auto"; 
        
        // Preferred Logic
        const preferredAttr = this.input.dataset.preferred || "";
        this.preferredCodes = preferredAttr ? preferredAttr.split(',').map(c => c.trim().toUpperCase()) : [];

        this.config = {
            placeholder: this.input.dataset.placeholder || "Select",
            ...options
        };

        this.countries = [];
        this.filteredCountries = [];
        this.isOpen = false;
        this.activeIndex = -1;
        this.rowHeight = 44; 
        
        this._init();
    }

    async _init() {
        this._applyStyles();
        this._setupDOM();
        this._bindEvents();
        await this._loadData();
    }

    _applyStyles() {
        const styles = `
            .cs-wrapper { position: relative; font-family: inherit; width: 100%; outline: none; }
            .cs-trigger { 
                /* Bootstrap 5 Exact Specs */
                padding: 0.375rem 2.25rem 0.375rem 0.75rem; 
                font-size: 1rem;
                font-weight: 400;
                line-height: 1.5;
                color: #212529;
                background-color: #fff;
                background-clip: padding-box;
                border: 1px solid #ced4da;
                border-radius: 0.375rem;
                transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
                display: flex; align-items: center; gap: 8px; cursor: pointer; 
                min-height: calc(1.5em + 0.75rem + 2px); 
                box-sizing: border-box; position: relative;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 16px 12px;
            }
            
            .input-group > .cs-wrapper { flex: 1 1 auto; width: 1%; }
            .cs-wrapper.is-invalid .cs-trigger { border-color: #dc3545 !important; }
            .cs-error-msg { display: none; color: #dc3545; font-size: 0.825em; margin-top: 4px; position: absolute; left: 0; top: 100%; width: 100%; z-index: 10; }
            .cs-wrapper.is-invalid .cs-error-msg { display: block; }

            /* Focus state Bootstrap 5 */
            .cs-wrapper:focus-within .cs-trigger {
                border-color: #86b7fe;
                outline: 0;
                box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
            }

            .cs-dropdown { 
                position: absolute; left: 0; right: 0; background: #fff; 
                border: 1px solid rgba(0,0,0,.15); border-radius: 0.375rem;
                z-index: 2050; display: none; margin-top: 0.125rem;
                box-shadow: 0 0.5rem 1rem rgba(0,0,0,.175);
                overflow: hidden; max-width: 95vw;
            }
            
            .cs-wrapper.drop-up .cs-dropdown { 
                bottom: calc(100% + 0.25rem); top: auto;
                box-shadow: 0 -0.5rem 1rem rgba(0,0,0,.175);
            }
            .cs-wrapper.open .cs-dropdown { display: block; }
            
            .cs-search-box { padding: 8px; border-bottom: 1px solid #dee2e6; background: #f8f9fa; }
            .cs-search-input { 
                width: 100%; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; 
                border-radius: 0.25rem; outline: none; font-size: 0.875rem;
            }
            .cs-list { overflow-y: auto; scrollbar-width: thin; scroll-behavior: auto; min-height: 50px; padding: 0.375rem 0; }
            .cs-option { 
                padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 10px; 
                cursor: pointer; font-size: 0.9rem; transition: background 0.1s;
            }
            .cs-option:hover { background-color: #f8f9fa; }
            .cs-option.active { background-color: #0d6efd; color: #fff; }
            
            .cs-wrapper img { width: 20px !important; height: 14px !important; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
            .cs-selected-content { display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; line-height: 1; }
            .cs-divider { height: 1px; background: #dee2e6; margin: 0.375rem 0; pointer-events: none; }
            .cs-hidden { display: none !important; }
        `;
        const styleId = 'cs-v57-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = styles;
            document.head.appendChild(style);
        }
    }

    _setupDOM() {
        Object.assign(this.input.style, { position: 'absolute', opacity: '0', width: '1px', height: '1px', pointerEvents: 'none' });
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'cs-wrapper';
        this.wrapper.tabIndex = 0; 
        const initialText = this.input.value ? "" : this.config.placeholder;
        this.wrapper.innerHTML = `
            <div class="cs-trigger"><span class="cs-selected-content">${initialText}</span></div>
            <div class="cs-error-msg"></div>
            <div class="cs-dropdown">
                <div class="cs-search-box ${!this.hasSearch ? 'cs-hidden' : ''}">
                    <input type="text" class="cs-search-input" placeholder="Search..." autocomplete="off" tabindex="-1">
                </div>
                <div class="cs-list"><div class="cs-loading" style="padding:15px; text-align:center;">Loading...</div></div>
            </div>
        `;
        const dropdown = this.wrapper.querySelector('.cs-dropdown');
        dropdown.style.width = (this.dropdownWidth === 'auto') ? '100%' : this.dropdownWidth;
        this.input.parentNode.insertBefore(this.wrapper, this.input.nextSibling);
    }

    _updatePosition() {
        const rect = this.wrapper.getBoundingClientRect();
        const dropdownHeight = (this.rowLimit * this.rowHeight) + (this.hasSearch ? 60 : 0);
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
            this.wrapper.classList.add('drop-up');
        } else {
            this.wrapper.classList.remove('drop-up');
        }
    }

    async _loadData() {
        try {
            const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,idd');
            const data = await res.json();
            
            this.countries = data.map(c => ({
                name: c.name.common,
                code: c.cca2.toUpperCase(),
                flag: c.flags.svg,
                phone: c.idd.root + (c.idd.suffixes ? (c.idd.suffixes.length > 1 ? "" : c.idd.suffixes[0]) : ""),
                isPreferred: this.preferredCodes.includes(c.cca2.toUpperCase())
            })).sort((a, b) => a.name.localeCompare(b.name));

            this.filteredCountries = [...this.countries];
            this._renderOptions();
            this._syncInitialValue();
        } catch (e) { console.error("CountrySelect API Fail", e); }
    }

    _syncInitialValue() {
        const val = this.input.value;
        if (!val) { this.wrapper.querySelector('.cs-selected-content').innerHTML = this.config.placeholder; return; }
        const current = this.countries.find(c => this.valueType === "phone" ? c.phone === val : this.valueType === "name" ? c.name === val : c.code === val);
        if (current) this._updateUI(current);
    }

    _parseTemplate(template, country) {
        return template.replace('{img}', `<img src="${country.flag}">`).replace('{name}', `<span>${country.name}</span>`).replace('{code}', `<span>${country.code}</span>`).replace('{phone}', `<span>${country.phone}</span>`);
    }

    _renderOptions() {
        const listContainer = this.wrapper.querySelector('.cs-list');
        if(!listContainer) return;
        listContainer.innerHTML = '';
        const searchVal = this.wrapper.querySelector('.cs-search-input')?.value || "";

        const preferred = this.filteredCountries.filter(c => c.isPreferred);
        const others = this.filteredCountries.filter(c => !c.isPreferred);

        const createOption = (country, index) => {
            const div = document.createElement('div');
            div.className = `cs-option ${index === this.activeIndex ? 'active' : ''}`;
            div.innerHTML = this._parseTemplate(this.schema, country);
            div.onclick = (e) => { e.stopPropagation(); this._select(country); };
            return div;
        };

        preferred.forEach((c, i) => listContainer.appendChild(createOption(c, i)));

        if (preferred.length > 0 && others.length > 0 && !searchVal) {
            const hr = document.createElement('div');
            hr.className = 'cs-divider';
            listContainer.appendChild(hr);
        }

        others.forEach((c, i) => listContainer.appendChild(createOption(c, preferred.length + i)));
    }

    _select(country) {
        this._updateUI(country);
        this.input.value = (this.valueType === "phone") ? country.phone : (this.valueType === "name" ? country.name : country.code);
        this.input.setCustomValidity("");
        this.wrapper.classList.remove('is-invalid');
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this._toggle(false);
        this.wrapper.focus(); 
    }

    _updateUI(country) {
        const content = this.wrapper.querySelector('.cs-selected-content');
        if(content) content.innerHTML = this._parseTemplate(this.schemaReturn, country);
    }

    _toggle(force) {
        if (this.countries.length === 0) return; 
        this.isOpen = force !== undefined ? force : !this.isOpen;
        if (this.isOpen) {
            this._updatePosition();
            document.dispatchEvent(new CustomEvent('cs-close-others', { detail: { opener: this.wrapper } }));
            
            this._renderOptions();
            const list = this.wrapper.querySelector('.cs-list');
            list.style.maxHeight = `${this.rowLimit * this.rowHeight}px`;

            const pref = this.filteredCountries.filter(c => c.isPreferred);
            const oth = this.filteredCountries.filter(c => !c.isPreferred);
            const fullList = [...pref, ...oth];
            this.activeIndex = fullList.findIndex(c => this.input.value.includes(c.code) || this.input.value.includes(c.phone));

            if (this.activeIndex > -1) setTimeout(() => this._scrollToActive(), 0);
            if (this.hasSearch) setTimeout(() => this.wrapper.querySelector('.cs-search-input').focus(), 50);
        }
        this.wrapper.classList.toggle('open', this.isOpen);
    }

    _bindEvents() {
        this.wrapper.querySelector('.cs-trigger').onclick = (e) => { e.stopPropagation(); this._toggle(); };
        this.wrapper.addEventListener('keydown', (e) => {
            if (!this.isOpen && (e.key === 'ArrowDown')) { e.preventDefault(); this._toggle(true); return; }
            if (this.isOpen) {
                if (e.key === 'ArrowDown') { e.preventDefault(); this.activeIndex++; this._renderOptions(); this._scrollToActive(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); this.activeIndex--; this._renderOptions(); this._scrollToActive(); }
                else if (e.key === 'Escape') this._toggle(false);
            }
        });
        if (this.hasSearch) {
            this.wrapper.querySelector('.cs-search-input').oninput = (e) => {
                const term = e.target.value.toLowerCase();
                this.filteredCountries = this.countries.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
                this.activeIndex = 0; 
                this._renderOptions();
            };
        }
        document.addEventListener('click', (e) => { if (!this.wrapper.contains(e.target)) this._toggle(false); });
        document.addEventListener('cs-close-others', (e) => { if (e.detail.opener !== this.wrapper) { this.isOpen = false; this.wrapper.classList.remove('open'); } });
    }

    _scrollToActive() {
        const list = this.wrapper.querySelector('.cs-list');
        const options = list.querySelectorAll('.cs-option');
        const activeItem = options[this.activeIndex];
        if (activeItem) {
            const scrollPos = activeItem.offsetTop - (list.offsetHeight / 2) + (this.rowHeight / 2);
            list.scrollTop = scrollPos;
        }
    }
}

/** AUTO-INIT (STATIC & HTMX) **/
const initCS = (target) => {
    const root = (target && target.querySelectorAll) ? target : document;
    root.querySelectorAll('.country-select').forEach(el => {
        const hasWrapper = el.nextSibling && el.nextSibling.classList && el.nextSibling.classList.contains('cs-wrapper');
        if (!hasWrapper) new CountrySelect(el);
    });
};
const setupListeners = () => {
    initCS(document);
    ['htmx:afterProcess', 'htmx:afterSettle'].forEach(evt => document.body.addEventListener(evt, (e) => initCS(e.detail.target || e.target)));
    new MutationObserver((m) => m.forEach(mu => mu.addedNodes.length && initCS(mu.target))).observe(document.body, { childList: true, subtree: true });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupListeners);
else setupListeners();
