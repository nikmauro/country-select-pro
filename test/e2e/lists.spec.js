const {test, expect, shown, control} = require('./helpers');

test.beforeEach(async ({open}) => {
    await open('lists.html');
});

const items = (page, selector) => page.evaluate((s) => CountrySelect.getInstance(s).countries.map((c) => ({
    code: c.code, name: c.name, phone: c.phone, value: c.value, flag: !!c.flag
})), selector);

test('<select>: own option texts, empty text from the built-in list, value goes to the select', async ({page}) => {
    expect(await shown(page, '#sel')).toBe('Cyprus · 3–4 days');
    const list = await items(page, '#sel');
    expect(list.find((c) => c.code === 'BG').name).toBe('Bulgaria');
    await page.evaluate(() => CountrySelect.getInstance('#sel').setValue('DE'));
    expect(await page.evaluate(() => new FormData(document.getElementById('form')).get('ship'))).toBe('DE');
});

test('data-countries JSON: own names and values, order kept, no flag where flag:false', async ({page}) => {
    const list = await items(page, '#json');
    expect(list.map((c) => c.name)).toEqual(['Greece – mainland', 'Cyprus', 'Store pickup']);
    expect(list[2]).toMatchObject({value: 'PICKUP', flag: false});
});

test('codes only: names and calling codes filled from the built-in list', async ({page}) => {
    const list = await items(page, '#merge');
    expect(list.map((c) => c.name + ' ' + c.phone)).toEqual(['Cyprus +357', 'Greece +30', 'Italy +39']);
});

test('data-src (ajax)', async ({page}) => {
    expect(await shown(page, '#ajax')).toBe('Nicosia hub');
    expect((await items(page, '#ajax')).length).toBe(3);
});

test('only / exclude countries', async ({page}) => {
    expect((await items(page, '#only')).map((c) => c.code)).toEqual(['CY', 'DE', 'GR']);
    const excl = (await items(page, '#excl')).map((c) => c.code);
    expect(excl).not.toContain('AQ');
    expect(excl).not.toContain('BV');
    expect(excl.length).toBe(248);
});

test('data-flags="false": no images', async ({page}) => {
    await expect(control(page, '#noflags').locator('img')).toHaveCount(0);
    expect(await shown(page, '#noflags')).toBe('Portugal');
});

test('phone mode lists only countries with a calling code', async ({page}) => {
    expect((await items(page, '#phone')).some((c) => c.code === 'BV')).toBe(false);
    expect((await items(page, '#code')).some((c) => c.code === 'BV')).toBe(true);
});

test('flags load from baseUrl and have a fixed size (no layout shift)', async ({page}) => {
    const img = control(page, '#code').locator('.cs-selected-content img');
    await expect(img).toHaveAttribute('src', '/dist/flags/4x3/gr.svg');
    await expect(img).toHaveAttribute('width', '20');
    await expect(img).toHaveAttribute('height', '14');
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth > 0)).toBe(true);
});
