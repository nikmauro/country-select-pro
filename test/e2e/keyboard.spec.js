const {test, expect, control} = require('./helpers');

test.beforeEach(async ({open}) => {
    await open('basic.html');
});

const state = (page, selector) => page.evaluate((s) => {
    const i = CountrySelect.getInstance(s);
    return {open: i.isOpen, active: i.activeIndex > -1 ? i.ordered[i.activeIndex].code : null, top: i.listEl.scrollTop, search: i.searchEl.value};
}, selector);

test('Enter keeps the selected country when preferred countries are shown first', async ({page}) => {
    const w = control(page, '#pref');
    await w.focus();
    await page.keyboard.press('Enter');
    await expect(w).toHaveClass(/open/);
    const first = await page.evaluate(() => CountrySelect.getInstance('#pref').ordered.slice(0, 3).map((c) => c.code));
    expect(first).toEqual(['BG', 'CY', 'GR']);
    expect(await state(page, '#pref')).toMatchObject({active: 'GR', top: 0}); // η λίστα ξεκινά από την αρχή (6.1.4)
    await page.keyboard.press('Enter');
    await expect(w).not.toHaveClass(/open/);
    expect(await page.inputValue('#pref')).toBe('GR'); // πριν από την 6.2.0: Albania
    await expect(w).toBeFocused();
});

test('arrow keys move, Enter selects the highlighted country', async ({page}) => {
    await control(page, '#pref').focus();
    await page.keyboard.press('ArrowDown'); // ανοίγει
    await page.keyboard.press('ArrowDown'); // GR → πρώτη μετά τις προτιμώμενες
    await page.keyboard.press('Enter');
    expect(await page.inputValue('#pref')).toBe('AF');
});

test('Home / End go to the first / last country', async ({page}) => {
    await control(page, '#plain').focus();
    await page.keyboard.press('End');
    expect((await state(page, '#plain')).active).toBe('ZW'); // Zimbabwe: τελευταία αλφαβητικά
    await page.keyboard.press('Escape');
    await page.keyboard.press('Home');
    expect((await state(page, '#plain')).active).toBe('AF');
});

test('Escape closes only the list — a surrounding modal does not receive it', async ({page}) => {
    const w = control(page, '#esc');
    await w.focus();
    await page.keyboard.press('Enter');
    await expect(w).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(w).not.toHaveClass(/open/);
    await expect(w).toBeFocused();
    expect(await page.evaluate(() => window.__escSeen)).toBe(0);
    await page.keyboard.press('Escape'); // κλειστό → το Escape περνά κανονικά
    expect(await page.evaluate(() => window.__escSeen)).toBe(1);
});

test('typing a letter on the closed control opens the search with it', async ({page}) => {
    await control(page, '#plain').focus();
    await page.keyboard.press('g');
    await page.keyboard.press('e');
    const s = await state(page, '#plain');
    expect(s.open).toBe(true);
    expect(s.search).toBe('ge');
    expect(s.active).toBe('GE'); // Georgia: πρώτη που ξεκινά από «ge»
});

test('Tab closes the list', async ({page}) => {
    const w = control(page, '#plain');
    await w.focus();
    await page.keyboard.press('Enter');
    await expect(w).toHaveClass(/open/);
    await page.keyboard.press('Tab');
    await expect(w).not.toHaveClass(/open/);
});

test('disabled and readonly controls do not open', async ({page}) => {
    const dis = control(page, '#dis');
    await expect(dis).toHaveAttribute('aria-disabled', 'true');
    await expect(dis).toHaveAttribute('tabindex', '-1');
    await dis.locator('.cs-trigger').click({force: true});
    await expect(dis).not.toHaveClass(/open/);

    const ro = control(page, '#ro');
    await expect(ro).toHaveAttribute('aria-readonly', 'true');
    await ro.focus();
    await page.keyboard.press('Enter');
    await expect(ro).not.toHaveClass(/open/);
});
