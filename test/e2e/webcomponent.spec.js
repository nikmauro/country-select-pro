// <country-select>: form-associated custom element
const {test, expect} = require('./helpers');
const AxeBuilder = require('@axe-core/playwright').default;

test.beforeEach(async ({open, page}) => {
    await open('webcomponent.html');
    await page.waitForFunction(() => [...document.querySelectorAll('country-select')].every((el) => el.instance));
    await page.evaluate(() => Promise.all([...document.querySelectorAll('country-select')].map((el) => el.instance.ready)));
});

const shownIn = (page, id) => page.evaluate((i) => document.getElementById(i).instance.contentEl.textContent.trim(), id);
const ctl = (page, id) => page.locator('#' + id + ' .cs-wrapper');

test('renders from attributes; value / country properties', async ({page}) => {
    expect(await shownIn(page, 'country')).toBe('Greece');
    expect(await shownIn(page, 'phone')).toBe('+357');
    expect(await shownIn(page, 'el')).toBe('Κύπρος');
    const r = await page.evaluate(() => {
        const el = document.getElementById('el');
        return {value: document.getElementById('country').value, code: document.getElementById('country').country.code, only: el.instance.countries.map((c) => c.code), search: el.instance.hasSearch};
    });
    // ελληνική σειρά: Γερμανία, Ελλάδα, Κύπρος
    expect(r).toEqual({value: 'GR', code: 'GR', only: ['DE', 'GR', 'CY'], search: false});
    await expect(ctl(page, 'country')).toHaveAttribute('aria-label', 'Country');
});

test('form value with the element name (inner input not submitted)', async ({page}) => {
    const before = await page.evaluate(() => [...new FormData(document.getElementById('form')).entries()]);
    expect(before).toEqual([['country', 'GR'], ['req', ''], ['phone_code', '+357'], ['el', 'CY'], ['in_fs', 'IT']]);
    await ctl(page, 'country').locator('.cs-trigger').click();
    await ctl(page, 'country').getByRole('option', {name: 'Cyprus', exact: true}).click();
    expect(await page.evaluate(() => new FormData(document.getElementById('form')).get('country'))).toBe('CY');
});

test('required: invalid until a country is chosen, reportValidity focuses the control', async ({page}) => {
    const r = await page.evaluate(() => {
        const el = document.getElementById('req');
        return {valid: document.getElementById('form').checkValidity(), missing: el.validity.valueMissing, matches: el.matches(':invalid')};
    });
    expect(r).toEqual({valid: false, missing: true, matches: true});
    await page.evaluate(() => document.getElementById('req').reportValidity());
    await expect(ctl(page, 'req')).toBeFocused();
    await expect(ctl(page, 'req')).toHaveClass(/is-invalid/);
    await page.evaluate(() => { document.getElementById('req').value = 'DE'; });
    expect(await page.evaluate(() => document.getElementById('form').checkValidity())).toBe(true);
});

test('form reset restores the value attribute', async ({page}) => {
    await page.evaluate(() => { document.getElementById('country').value = 'IT'; });
    expect(await shownIn(page, 'country')).toBe('Italy');
    await page.click('#reset');
    await expect.poll(() => page.evaluate(() => document.getElementById('country').value)).toBe('GR');
    expect(await shownIn(page, 'country')).toBe('Greece');
});

test('disabled fieldset disables the control (and it is not submitted)', async ({page}) => {
    await page.evaluate(() => { document.getElementById('fs').disabled = true; });
    await expect(ctl(page, 'in-fs')).toHaveAttribute('aria-disabled', 'true');
    await ctl(page, 'in-fs').locator('.cs-trigger').click({force: true});
    await expect(ctl(page, 'in-fs')).not.toHaveClass(/open/);
    expect(await page.evaluate(() => new FormData(document.getElementById('form')).has('in_fs'))).toBe(false);
});

test('value attribute change updates the control', async ({page}) => {
    await page.evaluate(() => document.getElementById('country').setAttribute('value', 'DE'));
    expect(await shownIn(page, 'country')).toBe('Germany');
});

test('events bubble to the element: change, country-change', async ({page}) => {
    const events = await page.evaluate(() => {
        const el = document.getElementById('country'), out = [];
        el.addEventListener('change', (e) => out.push('change:' + e.currentTarget.value));
        el.addEventListener('country-change', (e) => out.push('country-change:' + e.detail.country.code));
        el.instance.setValue('CY');
        return out;
    });
    expect(events).toEqual(['change:CY', 'country-change:CY']);
});

test('<label for> focuses the control', async ({page}) => {
    await page.click('label[for=country]');
    await expect(ctl(page, 'country')).toBeFocused();
});

test('htmx morph: rebuilt before paint with the server value, error message kept', async ({page}) => {
    const frame = await page.evaluate(() => new Promise((resolve) => {
        document.body.addEventListener('htmx:afterSwap', () => requestAnimationFrame(() => {
            const el = document.getElementById('morph');
            resolve({value: el.value, wrappers: el.querySelectorAll('.cs-wrapper').length, err: document.querySelector('#zone .err').textContent});
        }), {once: true});
        htmx.trigger('#f2', 'go');
    }));
    expect(frame).toEqual({value: 'FR', wrappers: 1, err: 'Error B (from server)'});
    await expect.poll(() => shownIn(page, 'morph')).toBe('France');
});

test('cloned element gets its own control', async ({page}) => {
    await page.evaluate(() => {
        const z = document.getElementById('clones');
        z.appendChild(z.firstElementChild.cloneNode(true));
    });
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('#clones country-select')]
        .map((el) => el.querySelectorAll('.cs-wrapper').length + ':' + !!(el.instance && el.instance.wrapper.isConnected)).join(' '))).toBe('1:true 1:true');
});

test('no serious accessibility violations', async ({page}) => {
    test.setTimeout(60000);
    const results = await new AxeBuilder({page}).include('main').analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
    expect(serious).toEqual([]);
});
