// Έλεγχος των TypeScript types (npm run check:types) — δεν τρέχει, μόνο μεταγλωττίζεται
import CountrySelect, {CountrySelect as Named, type CountrySelectOptions, type CountrySelectCountry, type CountryItem} from '../dist/country-select';

const options: CountrySelectOptions = {
    valueType: 'phone',
    preferredCountries: ['GR', 'CY'],
    onlyCountries: 'GR,CY,DE',
    lang: 'el',
    rows: 8,
    countries: async () => ['GR', {code: 'CY', name: 'Cyprus', phone: '+357'}, {value: 'PICKUP', name: 'Store pickup', flag: false}],
    fetchOptions: {credentials: 'same-origin'}
};

const cs = new CountrySelect('#country', options);
const same: Named = cs;

cs.ready.then((inst) => {
    const c: CountrySelectCountry | null = inst.getCountry();
    if (c) console.log(c.code, c.localName, c.phone.startsWith('+'));
});
cs.setValue('CY', {silent: true}).refresh().open();
const v: string = cs.getValue();
void cs.setCountries('/api/countries.json');
void cs.setCountries({GR: 'Greece', CY: {name: 'Cyprus', phone: '357'}});

const item: CountryItem = {code: 'GR', keywords: ['hellas']};
const input = document.querySelector('input')!;
input.addEventListener('country-change', (e) => {
    const code: string | undefined = e.detail.country?.code;
    console.log(e.detail.value, code, item, v, same);
});

CountrySelect.init(document.body);
const inst: CountrySelect | null = CountrySelect.getInstance(input);
inst?.destroy();
window.CountrySelectConfig = {css: false, autoInit: true, lang: 'auto'};
console.log(CountrySelect.version, window.CountrySelect.baseUrl);

// @ts-expect-error — μη έγκυρος valueType
new CountrySelect(input, {valueType: 'iso'});
