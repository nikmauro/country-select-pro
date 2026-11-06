// Κοινά για τα tests: άνοιγμα fixture με το build του project (src / min) και αναμονή να φορτώσουν όλα τα instances
const base = require('@playwright/test');

const test = base.test.extend({
    open: async ({page}, use, testInfo) => {
        await use(async (fixture) => {
            const build = (testInfo.project.metadata && testInfo.project.metadata.build) || 'src';
            await page.goto('/test/fixtures/' + fixture + (fixture.includes('?') ? '&' : '?') + 'build=' + build);
            await page.waitForFunction(() => window.CountrySelect
                && [...document.querySelectorAll('.country-select')].every((el) => el._csOff || CountrySelect.getInstance(el)));
            await page.evaluate(() => Promise.all([...document.querySelectorAll('.country-select')]
                .map((el) => CountrySelect.getInstance(el)).filter(Boolean).map((inst) => inst.ready)));
        });
    }
});

/** Το κείμενο που δείχνει το control ενός input / select */
const shown = (page, selector) => page.evaluate((s) => CountrySelect.getInstance(s).contentEl.textContent.trim(), selector);

/** Το control (.cs-wrapper) ενός input / select */
const control = (page, selector) => page.locator(selector + ' + .cs-wrapper');

module.exports = {test, expect: base.expect, shown, control};
