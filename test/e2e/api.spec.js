const {test, expect, shown, control} = require('./helpers');

test.beforeEach(async ({open}) => {
    await open('basic.html');
});

test('events: change → input → country-change with the country', async ({page}) => {
    const events = await page.evaluate(() => {
        const el = document.getElementById('ev'), out = [];
        ['change', 'input', 'country-change'].forEach((t) => el.addEventListener(t, (e) => out.push(t === 'country-change' ? {t, value: e.detail.value, code: e.detail.country.code, phone: e.detail.country.phone} : t)));
        CountrySelect.getInstance(el).setValue('IT');
        return out;
    });
    expect(events).toEqual(['change', 'input', {t: 'country-change', value: 'IT', code: 'IT', phone: '+39'}]);
});

test('setValue silent sends no events', async ({page}) => {
    const n = await page.evaluate(() => {
        const el = document.getElementById('ev');
        let count = 0;
        el.addEventListener('change', () => count++);
        CountrySelect.getInstance(el).setValue('CY', {silent: true});
        return {count, value: el.value};
    });
    expect(n).toEqual({count: 0, value: 'CY'});
});

test('click on an option selects it', async ({page}) => {
    const w = control(page, '#ev');
    await w.locator('.cs-trigger').click();
    await w.getByRole('option', {name: 'Cyprus', exact: true}).click();
    expect(await page.inputValue('#ev')).toBe('CY');
    await expect(w).not.toHaveClass(/open/);
    expect(await page.evaluate(() => CountrySelect.getInstance('#ev').getCountry())).toEqual({code: 'CY', name: 'Cyprus', localName: 'Cyprus', phone: '+357', value: 'CY'});
});

test('required: invalid state on validation, cleared on selection', async ({page}) => {
    const w = control(page, '#req');
    expect(await page.evaluate(() => document.getElementById('form').checkValidity())).toBe(false);
    await expect(w).toHaveClass(/is-invalid/);
    await expect(w).toHaveAttribute('aria-invalid', 'true');
    await page.evaluate(() => CountrySelect.getInstance('#req').setValue('GR'));
    await expect(w).not.toHaveClass(/is-invalid/);
});

test('form reset restores the initial values', async ({page}) => {
    await page.evaluate(() => {
        CountrySelect.getInstance('#ev').setValue('IT');
        CountrySelect.getInstance('#req').setValue('DE');
    });
    await page.click('#reset');
    await expect.poll(() => shown(page, '#ev')).toBe('Greece');
    await expect.poll(() => shown(page, '#req')).toBe('Select');
});

test('<label for> focuses the control', async ({page}) => {
    await page.click('label[for=pref]');
    await expect(control(page, '#pref')).toBeFocused();
});

test('refresh() after input.value = … without an event', async ({page}) => {
    await page.evaluate(() => {
        document.getElementById('plain').value = 'JP';
        CountrySelect.getInstance('#plain').refresh();
    });
    expect(await shown(page, '#plain')).toBe('Japan');
});

test('manual init with options (selector, defaultCountry, lang)', async ({page}) => {
    const r = await page.evaluate(async () => {
        const cs = new CountrySelect('#manual', {defaultCountry: 'IT', lang: 'de'});
        await cs.ready;
        return {value: cs.getValue(), shown: cs.contentEl.textContent.trim()};
    });
    expect(r).toEqual({value: 'IT', shown: 'Italien'});
});

test('destroy() restores the input and is final until new CountrySelect()', async ({page}) => {
    const r = await page.evaluate(async () => {
        const el = document.getElementById('plain');
        CountrySelect.getInstance(el).destroy();
        const after = {wrapper: !!el.nextElementSibling && el.nextElementSibling.classList.contains('cs-wrapper'), style: el.getAttribute('style'), tab: el.getAttribute('tabindex')};
        CountrySelect.init(document);
        await new Promise((res) => setTimeout(res, 50));
        after.afterInit = !!CountrySelect.getInstance(el);
        await new CountrySelect(el).ready;
        after.afterNew = !!CountrySelect.getInstance(el);
        return after;
    });
    expect(r).toEqual({wrapper: false, style: null, tab: null, afterInit: false, afterNew: true});
});
