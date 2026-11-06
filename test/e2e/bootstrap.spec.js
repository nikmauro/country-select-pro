// Πραγματικό Bootstrap 5.3: modal (scrollable) και offcanvas — όχι κομμένη λίστα, το focus trap αφήνει την αναζήτηση, Esc μόνο στη λίστα
const {test, expect, control} = require('./helpers');

test.beforeEach(async ({open}) => {
    await open('bootstrap.html');
});

test('list opened during the modal animation follows the control', async ({page}) => {
    const gap = await page.evaluate(async () => {
        bootstrap.Modal.getOrCreateInstance('#m').show();
        await new Promise((r) => setTimeout(r, 60)); // στη μέση του animation (transform)
        const cs = CountrySelect.getInstance('#in-m');
        cs.open();
        await new Promise((r) => setTimeout(r, 700)); // τέλος του animation
        return Math.round(cs.dropdownEl.getBoundingClientRect().top - cs.wrapper.getBoundingClientRect().bottom);
    });
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(4);
});

for (const [name, trigger, container, selector] of [
    ['modal', '[data-bs-target="#m"]', '#m', '#in-m'],
    ['offcanvas', '[data-bs-target="#oc"]', '#oc', '#in-oc']
]) {
    test(`Bootstrap ${name}: list on top, search keeps focus, Esc closes only the list`, async ({page}) => {
        await page.click(trigger);
        await expect(page.locator(container)).toHaveClass(/show/);
        await expect(page.locator(container)).toBeVisible();
        await page.waitForTimeout(400); // animation

        const w = control(page, selector);
        await w.locator('.cs-trigger').click();
        await expect(w.locator('.cs-search-input')).toBeFocused(); // το focus trap του Bootstrap δεν την παίρνει πίσω
        await page.keyboard.type('cyp');
        await expect(w.locator('.cs-option.active')).toHaveText('Cyprus');

        // η επιλογή είναι πραγματικά ορατή / πατήσιμη (στο top layer)
        const onTop = await page.evaluate((s) => {
            const opt = CountrySelect.getInstance(s).listEl.querySelector('.cs-option.active').getBoundingClientRect();
            const hit = document.elementFromPoint(opt.left + 10, opt.top + opt.height / 2);
            return !!(hit && hit.closest('.cs-option.active'));
        }, selector);
        expect(onTop).toBe(true);

        await page.keyboard.press('Escape');
        await expect(w).not.toHaveClass(/open/);
        await expect(page.locator(container)).toHaveClass(/show/); // το modal / offcanvas έμεινε ανοιχτό
        await expect(w).toBeFocused();

        await w.locator('.cs-trigger').click();
        await w.getByRole('option', {name: 'Cyprus', exact: true}).click();
        expect(await page.inputValue(selector)).toBe('CY');
        await expect(page.locator(container)).toHaveClass(/show/);
    });
}
