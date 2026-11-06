/*! CountrySelect Pro — TypeScript types | MIT | https://github.com/nikmauro/country-select-pro */

/** A selected country, as returned by `getCountry()` and `country-change` → `detail.country`. */
export interface CountrySelectCountry {
    /** ISO 3166-1 alpha-2 code, e.g. "GR" (may be empty for custom non-country items). */
    code: string;
    /** Name from the data (English for the built-in list). */
    name: string;
    /** Displayed name (translated with `lang`, otherwise = name). */
    localName: string;
    /** Calling code, e.g. "+30" (empty when unknown). */
    phone: string;
    /** Value written to the input. */
    value: string;
}

/** One item of a custom list. A plain string is an ISO code ("GR"). */
export interface CountryItem {
    /** ISO code (also accepted: `iso2`, `iso`, `alpha2`). */
    code?: string;
    /** Name (also accepted: `label`, `text`). Missing → from the built-in list. */
    name?: string;
    /** Calling code, "+30" or "30" (also accepted: `dial_code`, `dialCode`). Missing → from the built-in list. */
    phone?: string;
    /** Flag image URL, or `false` for no flag. Default: the built-in flag of `code`. */
    flag?: string | false;
    /** Custom value for the input (default depends on `valueType`). */
    value?: string;
    /** Extra search words. */
    keywords?: string | string[];
    /** Also accepted: alias of `keywords`. */
    aliases?: string | string[];
}

/** Any accepted list: array, `{countries | items | data | results: [...]}`, `{"GR": "Greece"}`, JSON string or URL, or a function returning one of them. */
export type CountryList =
    | Array<string | CountryItem>
    | {countries?: Array<string | CountryItem>; items?: Array<string | CountryItem>; data?: unknown; results?: Array<string | CountryItem>}
    | Record<string, string | CountryItem>;

export type CountrySource =
    | string
    | CountryList
    | Promise<CountryList>
    | (() => CountryList | string | Promise<CountryList | string>);

/** Options — also available as `data-*` attributes (see README). JS options win over attributes. */
export interface CountrySelectOptions {
    /** What the input holds: ISO code (default), calling code or name. `data-value-type` */
    valueType?: 'code' | 'phone' | 'name';
    /** Template of list items: `{img}` `{name}` `{code}` `{phone}`. Default "{img} {name}". `data-schema` */
    schema?: string;
    /** Template of the selected value. Default = schema. `data-schema-return` */
    schemaReturn?: string;
    /** Codes shown first. `data-preferred="GR,CY"` */
    preferredCountries?: string[] | string;
    /** Show only these codes. `data-only-countries` */
    onlyCountries?: string[] | string;
    /** Hide these codes. `data-exclude-countries` */
    excludeCountries?: string[] | string;
    /** ISO code selected when the input is empty. `data-default-country` */
    defaultCountry?: string;
    /** Text when nothing is selected (HTML allowed). `data-placeholder` */
    placeholder?: string;
    /** Search box. Default true. `data-country-search` */
    search?: boolean;
    /** `data-search-placeholder` */
    searchPlaceholder?: string;
    /** `data-no-results` */
    noResults?: string;
    loading?: string;
    loadError?: string;
    /** Screen-reader result count, `{n}` = number. */
    results?: string;
    /** The same for exactly one result, e.g. "{n} result". */
    result?: string;
    /** Accessible name of the list when the input has no label. */
    listLabel?: string;
    /** Visible rows. Default 5. `data-country-row-values` */
    rows?: number;
    /** e.g. "300px". Default "auto". `data-dropdown-width` */
    dropdownWidth?: string;
    /** List in the top layer (Popover API) — not clipped by modals / overflow. Default true. `data-popover` */
    popover?: boolean;
    /** Language of country names and texts ("el", "de" …) or "auto" (= `<html lang>`). `data-lang` */
    lang?: string;
    /** Show flags. Default true. `data-flags` */
    flags?: boolean;
    /** Sort by name. Default true; false keeps the order of your list. `data-sort` */
    sort?: boolean;
    /** Your list. `data-countries` (JSON) */
    countries?: CountrySource;
    /** URL of your list (JSON). `data-src` */
    dataUrl?: string;
    /** `fetch()` options for `dataUrl`. */
    fetchOptions?: RequestInit;
    /** Fill missing names / calling codes of your list from the built-in list. Default true. */
    merge?: boolean;
    /** Folder that contains dist/flags/ (self-hosting the flags; the country list is inside the script). `data-base-url` */
    baseUrl?: string;
    /** Flag URL template: `{code}` = "gr", `{CODE}` = "GR". `data-flag-path` */
    flagPath?: string;
}

/** Global defaults: `window.CountrySelectConfig = {...}` before the script loads. */
export interface CountrySelectConfig extends CountrySelectOptions {
    /** false = no built-in CSS (use dist/country-select.css or your own). */
    css?: boolean;
    /** false = no automatic init of `.country-select` elements. */
    autoInit?: boolean;
}

/** `detail` of the `country-change` event (dispatched on the input, bubbles). */
export interface CountryChangeDetail {
    value: string;
    country: CountrySelectCountry | null;
}

export declare class CountrySelect {
    /**
     * @param element input / select element or CSS selector
     * @param options override the `data-*` attributes
     */
    constructor(element: HTMLInputElement | HTMLSelectElement | string, options?: CountrySelectOptions);

    static readonly version: string;
    /** Default folder of dist/flags/ (jsDelivr, same version). */
    static baseUrl: string;
    /** Global defaults (from `window.CountrySelectConfig`). */
    static defaults: CountrySelectConfig;
    /** Initialize every `.country-select` inside `root` (default: document). */
    static init(root?: ParentNode | Element | Document): void;
    /** The live instance of an element, or null. */
    static getInstance(element: Element | string | null | undefined): CountrySelect | null;

    /** The original input / select (kept as the form field). */
    readonly input: HTMLInputElement | HTMLSelectElement;
    /** The visible control (.cs-wrapper). */
    readonly wrapper: HTMLDivElement;
    /** Resolved when the list is loaded. */
    readonly ready: Promise<CountrySelect>;
    readonly isOpen: boolean;

    open(): void;
    close(refocus?: boolean): void;
    toggle(): void;
    /** Select by value (code / calling code / name according to `valueType`). Dispatches change, input and country-change unless `silent`. */
    setValue(value: string, options?: {silent?: boolean}): this;
    getValue(): string;
    getCountry(): CountrySelectCountry | null;
    /** Replace the list (array, function, JSON string, URL). */
    setCountries(source: CountrySource): Promise<void>;
    /** Re-read the input value (after `input.value = …` without an event). */
    refresh(): this;
    /** Remove the control and restore the input. */
    destroy(): void;
}

export default CountrySelect;

declare global {
    interface Window {
        CountrySelect: typeof CountrySelect;
        CountrySelectConfig?: CountrySelectConfig;
    }
    interface HTMLElementEventMap {
        'country-change': CustomEvent<CountryChangeDetail>;
    }
}
