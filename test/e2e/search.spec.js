const {test, expect, control} = require('./helpers');

test.beforeEach(async ({open}) => {
    await open('basic.html');
});

/** Αναζήτηση στο #plain (χωρίς προτιμώμενες) → οι πρώτες χώρες */
const search = (page, term) => page.evaluate((t) => {
    const i = CountrySelect.getInstance('#plain');
    i.open();
    i.searchEl.value = t;
    i.searchEl.dispatchEvent(new Event('input'));
    return i.ordered.slice(0, 3).map((c) => c.name);
}, term);

const cases = [
    ['cote', 'Côte d’Ivoire'],       // χωρίς τόνους
    ['ivory coast', 'Côte d’Ivoire'], // παλιό όνομα
    ['curacao', 'Curaçao'],
    ['ελλαδα', 'Greece'],             // ελληνικά, χωρίς τόνους
    ['uk', 'United Kingdom'],         // ακριβής λέξη πριν από το «Ukraine»
    ['usa', 'United States'],
    ['turkey', 'Türkiye'],
    ['holy see', 'Vatican City'],
    ['gr', 'Greece'],
    ['+1', 'United States'],          // κοινός κωδικός → κύρια χώρα πρώτη
    ['357', 'Cyprus']
];

for (const [term, first] of cases) {
    test(`"${term}" → ${first}`, async ({page}) => {
        expect((await search(page, term))[0]).toBe(first);
    });
}

test('typed search highlights the first match and announces the count', async ({page}) => {
    const w = control(page, '#plain');
    await w.locator('.cs-trigger').click();
    await expect(w.locator('.cs-search-input')).toBeFocused();
    await page.keyboard.type('cura');
    await expect(w.locator('.cs-option.active')).toHaveText('Curaçao');
    await expect(w.locator('.cs-sr-only')).toHaveText('1 result'); // ενικός
    await page.keyboard.press('Enter');
    expect(await page.inputValue('#plain')).toBe('CW');
});

test('no results message', async ({page}) => {
    expect(await search(page, 'zzzz')).toEqual([]);
    await expect(control(page, '#plain').locator('.cs-no-results')).toHaveText('Not found');
});

test('reopening clears the previous search', async ({page}) => {
    await search(page, 'gr');
    await page.evaluate(() => CountrySelect.getInstance('#plain').close());
    const n = await page.evaluate(() => {
        const i = CountrySelect.getInstance('#plain');
        i.open();
        return {search: i.searchEl.value, count: i.ordered.length};
    });
    expect(n).toEqual({search: '', count: 250});
});
