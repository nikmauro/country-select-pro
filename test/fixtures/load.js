// Φορτώνει το build που ζητά το ?build= (src → dist/country-select.js · min → dist/country-select.min.js),
// σύγχρονα όπως ένα κανονικό <script>. Οι σημαίες από τον τοπικό server (baseUrl '/'), όχι από το CDN.
(function () {
    var min = new URLSearchParams(location.search).get('build') === 'min';
    window.CountrySelectConfig = Object.assign({baseUrl: '/'}, window.CountrySelectConfig);
    document.write('<script src="/dist/' + (min ? 'country-select.min.js' : 'country-select.js') + '"></scr' + 'ipt>');
})();
