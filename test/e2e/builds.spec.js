// Builds: CSS αρχείο κάτω από αυστηρό CSP, ES module, <style> από το JS όταν δεν υπάρχει CSS αρχείο
const {test, expect, control} = require('./helpers');

test('CSS file under a strict CSP: no violations, no injected <style>, styled control', async ({page}) => {
    await page.addInitScript(() => {
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));
    });
    await page.goto('/test/fixtures/csp.html');
    await page.waitForFunction(() => window.CountrySelect && CountrySelect.getInstance('#c'));
    await page.evaluate(() => CountrySelect.getInstance('#c').ready);
    const w = control(page, '#c');
    await w.locator('.cs-trigger').click();
    await expect(w.locator('.cs-dropdown')).toBeVisible();
    const r = await page.evaluate(() => ({
        csp: window.__csp,
        injected: !!document.getElementById('cs-styles'),
        marker: getComputedStyle(document.documentElement).getPropertyValue('--cs-css').trim(),
        border: getComputedStyle(document.querySelector('.cs-trigger')).borderTopStyle
    }));
    expect(r).toEqual({csp: [], injected: false, marker: '1', border: 'solid'});
});

test('without the CSS file the script adds its <style>', async ({open, page}) => {
    await open('basic.html');
    expect(await page.evaluate(() => !!document.getElementById('cs-styles'))).toBe(true);
});

test('ES module: default + named export, same as window.CountrySelect', async ({page}) => {
    await page.goto('/test/fixtures/esm.html');
    await page.waitForFunction(() => window.__esm);
    const r = await page.evaluate(() => window.__esm);
    expect(r.same).toBe(true);
    expect(r.manual.code).toBe('GR');
    await page.waitForFunction(() => CountrySelect.getInstance('#auto'));
    expect(await page.inputValue('#auto')).toBe('CY');
});
