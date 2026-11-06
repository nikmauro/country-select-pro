// Η λίστα (Popover API, top layer) δεν κόβεται από overflow / transform / modal / <dialog>
const {test, expect, control} = require('./helpers');

test.beforeEach(async ({open, page}) => {
    await open('overflow.html');
    const supported = await page.evaluate(() => Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover'));
    test.skip(!supported, 'Popover API not supported');
});

/** Ανοίγει τη λίστα και επιστρέφει: είναι στο top layer; τι βρίσκεται σε σημείο της λίστας ΕΞΩ από το κουτί; */
const probe = (page, selector, boxSelector) => page.evaluate(([s, b]) => {
    const cs = CountrySelect.getInstance(s);
    cs.open();
    const d = cs.dropdownEl.getBoundingClientRect(), box = document.querySelector(b).getBoundingClientRect();
    const x = d.left + 20, y = Math.min(d.bottom - 10, box.bottom + 30); // κάτω από το κουτί, μέσα στη λίστα
    const hit = document.elementFromPoint(x, y);
    return {
        topLayer: cs.dropdownEl.matches(':popover-open'),
        below: d.bottom > box.bottom,
        hitInList: !!(hit && hit.closest('.cs-dropdown') === cs.dropdownEl),
        gap: Math.round(d.top - cs.wrapper.getBoundingClientRect().bottom)
    };
}, [selector, boxSelector]);

test('not clipped by an overflow:hidden container', async ({page}) => {
    const r = await probe(page, '#in-clip', '#clip-box');
    expect(r).toMatchObject({topLayer: true, below: true, hitInList: true});
    expect(r.gap).toBeGreaterThanOrEqual(0);
    expect(r.gap).toBeLessThanOrEqual(4);
    // επιλογή που είναι έξω από το κουτί
    await control(page, '#in-clip').getByRole('option', {name: 'Cyprus', exact: true}).click();
    expect(await page.inputValue('#in-clip')).toBe('CY');
});

test('not clipped inside a transformed, scrolling modal (Bootstrap-like)', async ({page}) => {
    await page.evaluate(() => { document.getElementById('modal').hidden = false; });
    const r = await probe(page, '#in-modal', '.fake-modal-body');
    expect(r).toMatchObject({topLayer: true, below: true, hitInList: true});
});

test('inside a modal <dialog>: on top, Escape closes only the list', async ({page}) => {
    await page.evaluate(() => document.getElementById('dlg').showModal());
    const r = await probe(page, '#in-dialog', '#dlg');
    expect(r.topLayer).toBe(true);
    expect(r.hitInList).toBe(true);
    await control(page, '#in-dialog').locator('.cs-search-input').focus();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => ({list: CountrySelect.getInstance('#in-dialog').isOpen, dialog: document.getElementById('dlg').open})))
        .toEqual({list: false, dialog: true});
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => document.getElementById('dlg').open)).toBe(false);
});

test('follows the control when the page scrolls, closes when it leaves the screen', async ({page}) => {
    await page.evaluate(() => CountrySelect.getInstance('#scroll-me').open());
    const gap = () => page.evaluate(() => {
        const cs = CountrySelect.getInstance('#scroll-me');
        return Math.round(cs.dropdownEl.getBoundingClientRect().top - cs.wrapper.getBoundingClientRect().bottom);
    });
    const before = await gap();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect.poll(gap).toBe(before);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => CountrySelect.getInstance('#scroll-me').isOpen)).toBe(false);
});

test('data-popover="false" keeps the old in-page list', async ({page}) => {
    const r = await probe(page, '#inline', '#inline-box');
    expect(r.topLayer).toBe(false);
    expect(r.hitInList).toBe(false); // κομμένη από το κουτί, όπως ≤ 6.4
});
