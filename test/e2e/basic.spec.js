const {test, expect, shown, control} = require('./helpers');
const pkg = require('../../package.json');

test.beforeEach(async ({open}) => {
    await open('basic.html');
});

test('auto-init: one control per input, hidden input out of the Tab order', async ({page}) => {
    const inputs = await page.evaluate(() => [...document.querySelectorAll('input.country-select')].map((el) => ({
        id: el.id,
        live: !!CountrySelect.getInstance(el),
        next: el.nextElementSibling ? el.nextElementSibling.className : '',
        tab: el.tabIndex
    })));
    expect(inputs.length).toBeGreaterThan(10);
    for (const x of inputs) {
        expect(x.live, x.id).toBe(true);
        expect(x.next, x.id).toContain('cs-wrapper');
        expect(x.tab, x.id).toBe(-1);
    }
    await expect(page.locator('.cs-wrapper')).toHaveCount(inputs.length);
});

test('ARIA: combobox with the label of the input, listbox, active option', async ({page}) => {
    const w = control(page, '#pref');
    await expect(w).toHaveAttribute('role', 'combobox');
    await expect(w).toHaveAttribute('aria-label', 'Preferred');
    await expect(w).toHaveAttribute('aria-expanded', 'false');
    await w.locator('.cs-trigger').click();
    await expect(w).toHaveAttribute('aria-expanded', 'true');
    await expect(w.locator('[role=listbox] [role=option]').first()).toBeVisible();
    const active = await w.getAttribute('aria-activedescendant');
    await expect(page.locator('#' + active)).toHaveText('Greece');
    await expect(page.locator('#' + active)).toHaveAttribute('aria-selected', 'true');
});

test('values: ISO code, shared calling codes, names, language, default', async ({page}) => {
    expect(await shown(page, '#pref')).toBe('Greece');
    expect(await shown(page, '#us')).toBe('United States +1'); // +1 → ΗΠΑ, όχι American Samoa
    expect(await shown(page, '#gb')).toBe('United Kingdom +44');
    expect(await shown(page, '#ca')).toBe('Canada'); // κοινός κωδικός: η προτιμώμενη χώρα
    expect(await shown(page, '#lower')).toBe('Greece'); // κωδικός με μικρά
    expect(await shown(page, '#name')).toBe('Türkiye'); // παλιό όνομα (Turkey) αναγνωρίζεται
    expect(await shown(page, '#el')).toBe('Κύπρος');
    expect(await page.inputValue('#def')).toBe('CY');
    expect(await shown(page, '#plain')).toBe('Pick one');
});

test('new CountrySelect() on a live element returns the same instance', async ({page}) => {
    const same = await page.evaluate(() => new CountrySelect('#pref') === CountrySelect.getInstance('#pref'));
    expect(same).toBe(true);
});

test('version matches package.json', async ({page}) => {
    expect(await page.evaluate(() => CountrySelect.version)).toBe(pkg.version);
});
