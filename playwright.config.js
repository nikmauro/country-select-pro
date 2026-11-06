// Playwright — npm test (όλοι οι browsers) · npm run test:chromium (γρήγορα)
const {defineConfig, devices} = require('@playwright/test');

const PORT = 4173;

module.exports = defineConfig({
    testDir: 'test/e2e',
    timeout: 20000,
    expect: {timeout: 5000},
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:' + PORT,
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'node test/server.js ' + PORT,
        url: 'http://127.0.0.1:' + PORT + '/test/fixtures/basic.html',
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore'
    },
    projects: [
        // metadata.build: ποιο αρχείο φορτώνουν τα fixtures (src = dist/country-select.js, min = dist/country-select.min.js)
        {name: 'chromium', use: {...devices['Desktop Chrome']}, metadata: {build: 'src'}},
        {name: 'firefox', use: {...devices['Desktop Firefox']}, metadata: {build: 'src'}, testIgnore: /data.spec/},
        {name: 'webkit', use: {...devices['Desktop Safari']}, metadata: {build: 'src'}, testIgnore: /data.spec/},
        // το minified: τα tests συμπεριφοράς (όχι λίστα / builds / axe, που δεν εξαρτώνται από το minification)
        {name: 'chromium-min', use: {...devices['Desktop Chrome']}, metadata: {build: 'min'}, testIgnore: /(data|builds|a11y).spec/}
    ]
});
