const {test, expect, shown} = require('./helpers');

test.beforeEach(async ({open}) => {
    await open('htmx.html');
});

test('htmx morph: no flash of the raw input and the server error message stays (6.3.1)', async ({page}) => {
    for (let n = 1; n <= 2; n++) {
        await page.evaluate(() => htmx.trigger('#f', 'go'));
        await expect.poll(() => page.evaluate(() => window.__frames.length)).toBe(n);
        const frame = await page.evaluate((i) => window.__frames[i], n - 1);
        expect(frame).toEqual({live: true, inputHidden: true, wrappers: 1, err: 'Error B (from server)'});
    }
    expect(await shown(page, '#zone .country-select')).toBe('Cyprus');
    await expect(page.locator('#zone .field > *')).toHaveCount(3); // input, control, μήνυμα λάθους
});

test('new HTML (innerHTML swap) is initialized', async ({page}) => {
    await page.evaluate(() => {
        document.getElementById('swap-zone').innerHTML = '<input type="text" class="country-select" id="sw" value="DE" aria-label="Swap">';
    });
    await expect.poll(() => page.evaluate(() => !!CountrySelect.getInstance('#sw'))).toBe(true);
    await page.evaluate(() => CountrySelect.getInstance('#sw').ready);
    expect(await shown(page, '#sw')).toBe('Germany');
});

test('cloned rows (cloneNode) get their own control', async ({page}) => {
    await page.evaluate(() => {
        const rows = document.getElementById('rows');
        rows.appendChild(rows.firstElementChild.cloneNode(true));
        rows.appendChild(rows.firstElementChild.cloneNode(true));
    });
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('#rows .row-item')]
        .map((r) => r.querySelectorAll('.cs-wrapper').length + ':' + !!CountrySelect.getInstance(r.querySelector('input'))).join(' ')))
        .toBe('1:true 1:true 1:true');
});

test('stale HTML copy (htmx history restore) is re-initialized', async ({page}) => {
    await page.evaluate(() => {
        const h = document.getElementById('hist');
        h.innerHTML = h.innerHTML; // αντίγραφο με data-cs-initialized και «νεκρό» .cs-wrapper
    });
    await expect.poll(() => page.evaluate(() => !!CountrySelect.getInstance('#hi'))).toBe(true);
    await expect(page.locator('#hist .cs-wrapper')).toHaveCount(1);
    expect(await shown(page, '#hi')).toBe('Portugal');
});
