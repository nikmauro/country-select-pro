// Accessibility (axe-core): χωρίς σοβαρά / κρίσιμα προβλήματα, κλειστό και ανοιχτό
const {test, expect, control} = require('./helpers');
const AxeBuilder = require('@axe-core/playwright').default;

// το axe σαρώνει όλα τα controls της σελίδας (14 × 250 επιλογές) — στον Firefox θέλει περισσότερο χρόνο
test.describe.configure({timeout: 60000});

const serious = async (page) => {
    const results = await new AxeBuilder({page}).include('main').analyze();
    return results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => v.id + ': ' + v.nodes.map((n) => n.target.join(' ')).join(', '));
};

test('no serious accessibility violations (closed)', async ({open, page}) => {
    await open('basic.html');
    expect(await serious(page)).toEqual([]);
});

test('no serious accessibility violations (open, after a search)', async ({open, page}) => {
    await open('basic.html');
    const w = control(page, '#pref');
    await w.locator('.cs-trigger').click();
    await page.keyboard.type('cy');
    await expect(w.locator('.cs-option.active')).toBeVisible();
    expect(await serious(page)).toEqual([]);
});

test('<select> and custom lists', async ({open, page}) => {
    await open('lists.html');
    expect(await serious(page)).toEqual([]);
});
