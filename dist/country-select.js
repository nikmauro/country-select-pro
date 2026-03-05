/**
 * CountrySelect Pro v4.8.3
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
        
        this.config = {
            placeholder: this.input.dataset.placeholder || "Select",
            preferred: this.input.dataset.preferred ? this.input.dataset.preferred.split(',') : [],
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
            .cs-wrapper { position: relative; font-family: system-ui, sans-serif; outline: none; box-sizing: border-box; display: block; width: 100%; }
            .cs-trigger { 
                padding: 10px 35px 10px 12px; border: 1px solid #ccc; border-radius: 6px; 
                display: flex; align-items: center; gap: 10px; cursor: pointer; background: #fff; min-height: 42px; box-sizing: border-box;
                transition: border-color 0.15s ease-in-out; position: relative;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
            }
            .input-group-text .cs-trigger { background-position: right 0px center; padding-right: 25px; border: none; background-color: transparent; min-height: auto; }
            .cs-wrapper.is-invalid .cs-trigger { border-color: #dc3545 !important; }
            .cs-error-msg { display: none; color: #dc3545; font-size: 0.825em; margin-top: 4px; position: absolute; left: 0; top: 100%; width: 100%; z-index: 10; }
            .cs-wrapper.is-invalid .cs-error-msg { display: block; }
            .cs-wrapper:focus .cs-trigger { border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.15); }
            .cs-dropdown { position: absolute; top: calc(100% + 8px); left: 0; background: #fff; border: 1px solid #ccc; z-index: 2050; display: none; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden; max-width: 95vw; }
            .cs-wrapper.open .cs-dropdown { display: block; }
            .cs-search-box { padding: 8px; border-bottom: 1px solid #eee; background: #f9f9f9; }
            .cs-search-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; outline: none; }
            .cs-list { overflow-y: auto; scrollbar-width: thin; scroll-behavior: smooth; min-height: 50px; }
            .cs-option { height: 44px; padding: 0 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; box-sizing: border-box; color: #333; }
            .cs-option:hover, .cs-option.active { background: #f0f7ff; color: #0056b3; }
            .cs-wrapper img { width: 22px !important; height: 15px !important; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
            .cs-selected-content { display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap; min-width: 20px; font-size: 14px; }
            .cs-hidden { display: none !important; }
        `;
        const styleId = 'cs-v5-styles';
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
        if (this.input.classList.contains('is-invalid')) this._showError();
    }

    async _loadData() {
        try {
            const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,idd');
            const data = await res.json();
            this.countries = data.map(c => ({
                name: c.name.common,
                code: c.cca2,
                flag: c.flags.svg,
                phone: c.idd.root + (c.idd.suffixes ? (c.idd.suffixes.length > 1 ? "" : c.idd.suffixes[0]) : "")
            })).sort((a, b) => a.name.localeCompare(b.name));
            this.filteredCountries = [...this.countries];
            this._renderOptions();
            this._syncInitialValue();
        } catch (e) { console.error("CountrySelect: API Failed", e); }
    }

    _syncInitialValue() {
        const val = this.input.value;
        if (!val) { this.wrapper.querySelector('.cs-selected-content').innerHTML = this.config.placeholder; return; }
        const current = this.countries.find(c => this.valueType === "phone" ? c.phone === val : this.valueType === "name" ? c.name === val : c.code === val);
        if (current) this._updateUI(current);
        else this.wrapper.querySelector('.cs-selected-content').innerHTML = this.config.placeholder;
    }

    _parseTemplate(template, country) {
        return template.replace('{img}', `<img src="${country.flag}">`).replace('{name}', `<span>${country.name}</span>`).replace('{code}', `<span>${country.code}</span>`).replace('{phone}', `<span>${country.phone}</span>`);
    }

    _renderOptions() {
        const listContainer = this.wrapper.querySelector('.cs-list');
        if(!listContainer) return;
        listContainer.innerHTML = '';
        this.filteredCountries.forEach((country, index) => {
            const div = document.createElement('div');
            div.className = `cs-option ${index === this.activeIndex ? 'active' : ''}`;
            div.innerHTML = this._parseTemplate(this.schema, country);
            div.onclick = (e) => { e.stopPropagation(); this._select(country); };
            listContainer.appendChild(div);
        });
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

    _showError() {
        const errorDiv = this.wrapper.querySelector('.cs-error-msg');
        errorDiv.textContent = this.input.validationMessage || "Invalid selection";
        this.wrapper.classList.add('is-invalid');
    }

    _toggle(force) {
        if (this.countries.length === 0) return; 
        this.isOpen = force !== undefined ? force : !this.isOpen;
        if (this.isOpen) {
            document.dispatchEvent(new CustomEvent('cs-close-others', { detail: { opener: this.wrapper } }));
            this.activeIndex = this.filteredCountries.findIndex(c => this.input.value.includes(c.code) || this.input.value.includes(c.phone));
            this._renderOptions();
            const list = this.wrapper.querySelector('.cs-list');
            list.style.maxHeight = `${this.rowLimit * this.rowHeight}px`;
            if (this.activeIndex > -1) setTimeout(() => this._scrollToActive(), 50);
            if (this.hasSearch) setTimeout(() => this.wrapper.querySelector('.cs-search-input').focus(), 50);
        }
        this.wrapper.classList.toggle('open', this.isOpen);
    }

    _bindEvents() {
        this.wrapper.querySelector('.cs-trigger').onclick = (e) => { e.stopPropagation(); this._toggle(); };
        this.input.addEventListener('invalid', (e) => { e.preventDefault(); this._showError(); });
        this.wrapper.addEventListener('keydown', (e) => {
            if (!this.isOpen && (e.key === 'Enter' || e.key === 'ArrowDown')) { e.preventDefault(); this._toggle(true); return; }
            if (this.isOpen) {
                if (e.key === 'ArrowDown') { e.preventDefault(); this.activeIndex = Math.min(this.activeIndex + 1, this.filteredCountries.length - 1); this._renderOptions(); this._scrollToActive(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); this.activeIndex = Math.max(this.activeIndex - 1, 0); this._renderOptions(); this._scrollToActive(); }
                else if (e.key === 'Enter' && this.activeIndex > -1) { e.preventDefault(); this._select(this.filteredCountries[this.activeIndex]); }
                else if (e.key === 'Escape') this._toggle(false);
            }
        });
        if (this.hasSearch) {
            this.wrapper.querySelector('.cs-search-input').oninput = (e) => {
                const term = e.target.value.toLowerCase();
                this.filteredCountries = this.countries.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
                this.activeIndex = 0; this._renderOptions();
            };
        }
        document.addEventListener('click', (e) => { if (!this.wrapper.contains(e.target)) this._toggle(false); });
        document.addEventListener('cs-close-others', (e) => { if (e.detail.opener !== this.wrapper) { this.isOpen = false; this.wrapper.classList.remove('open'); } });
    }

    _scrollToActive() {
        const list = this.wrapper.querySelector('.cs-list');
        const activeItem = list.querySelectorAll('.cs-option')[this.activeIndex];
        if (activeItem) list.scrollTop = activeItem.offsetTop - (list.offsetHeight / 2) + (this.rowHeight / 2);
    }
}

/**
 * v5.3 - HTMX & Dynamic Content Hardened Logic
 */
const initCS = (target) => {
    const root = target || document;
    if (!root.querySelectorAll) return;

    root.querySelectorAll('.country-select').forEach(el => {
        // Πιο αυστηρός έλεγχος για να μην διπλασιάζεται
        const next = el.nextSibling;
        const hasWrapper = next && next.classList && next.classList.contains('cs-wrapper');
        
        if (!hasWrapper) {
            new CountrySelect(el);
        }
    });
};

const setupListeners = () => {
    // 1. Initial Load
    initCS(document);

    // 2. HTMX Listeners (Πολλαπλά events για σιγουριά)
    const htmxEvents = ['htmx:afterProcess', 'htmx:afterOnLoad', 'htmx:afterSettle'];
    htmxEvents.forEach(evtName => {
        document.body.addEventListener(evtName, (e) => {
            // Αν το HTMX επιστρέφει ολόκληρη φόρμα ή μόνο το inner content
            const target = e.detail.target || e.target;
            initCS(target);
        });
    });

    // 3. Mutation Observer - Η απόλυτη δικλείδα ασφαλείας
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length) {
                initCS(mutation.target);
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

// Execution Trigger
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupListeners);
} else {
    setupListeners();
}
