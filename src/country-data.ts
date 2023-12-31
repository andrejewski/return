import * as countryCodeMapping from 'svg-country-flags/countries.json'

type Side = 'left' | 'right'

/*
  Data pulled from Wikipedia, see: https://en.wikipedia.org/wiki/Left-_and_right-hand_traffic
  DevTools snippet to get this JSON:

  ```js
  r = $0.querySelectorAll('tr') // $0 is selected <table>
  countrySideLabelPairs = Array.from(r).filter(r => r.childElementCount === 4).map(r => [r.children[0].textContent, r.children[1].textContent].map(x => x.trim()))
  countrySidePairs = countrySideLabelPairs.map(([c, label]) => [c, label.toLowerCase().startsWith('r') ? 'right' : 'left'])

  copy(JSON.stringify(Object.fromEntries(countrySidePairs)), null, 2)
  ```
*/
const rawCountrySideData: Record<string, Side> = {
  Afghanistan: 'right',
  Albania: 'right',
  Algeria: 'right',
  Andorra: 'right',
  Angola: 'right',
  'Antigua and Barbuda': 'left',
  Argentina: 'right',
  Armenia: 'right',
  Australia: 'left',
  Austria: 'right',
  Azerbaijan: 'right',
  Bahamas: 'left',
  Bahrain: 'right',
  Bangladesh: 'left',
  Barbados: 'left',
  Belarus: 'right',
  Belgium: 'right',
  Belize: 'right',
  Benin: 'right',
  Bhutan: 'left',
  Bolivia: 'right',
  'Bosnia and Herzegovina': 'right',
  Botswana: 'left',
  Brazil: 'right',
  Brunei: 'left',
  Bulgaria: 'right',
  'Burkina Faso': 'right',
  Burundi: 'right',
  Cambodia: 'right',
  Cameroon: 'right',
  'Cape Verde': 'right',
  'Central African Republic': 'right',
  Chile: 'right',
  'Hong Kong': 'left',
  Macau: 'left',
  Colombia: 'right',
  Comoros: 'right',
  Congo: 'right',
  'DR Congo': 'right',
  'Costa Rica': 'right',
  "Ivory Coast(Côte d'Ivoire)": 'right',
  Croatia: 'right',
  Cuba: 'right',
  Cyprus: 'left',
  'Czech Republic': 'right',
  Denmark: 'right',
  Djibouti: 'right',
  Dominica: 'left',
  'Dominican Republic': 'right',
  'East Timor': 'left',
  Ecuador: 'right',
  Egypt: 'right',
  'El Salvador': 'right',
  'Equatorial Guinea': 'right',
  Eritrea: 'right',
  Estonia: 'right',
  Eswatini: 'left',
  Ethiopia: 'right',
  Fiji: 'left',
  Finland: 'right',
  France: 'right',
  Gabon: 'right',
  Gambia: 'right',
  Georgia: 'right',
  Germany: 'right',
  Ghana: 'right',
  Greece: 'right',
  Grenada: 'left',
  Guatemala: 'right',
  Guinea: 'right',
  'Guinea-Bissau': 'right',
  Guyana: 'left',
  Haiti: 'right',
  Honduras: 'right',
  Hungary: 'right',
  Iceland: 'right',
  India: 'left',
  Indonesia: 'left',
  Iran: 'right',
  Iraq: 'right',
  Ireland: 'left',
  Israel: 'right',
  Italy: 'right',
  Jamaica: 'left',
  Japan: 'left',
  Jordan: 'right',
  Kazakhstan: 'right',
  Kenya: 'left',
  Kiribati: 'left',
  Kosovo: 'right',
  Kuwait: 'right',
  Kyrgyzstan: 'right',
  Laos: 'right',
  Latvia: 'right',
  Lebanon: 'right',
  Lesotho: 'left',
  Liberia: 'right',
  Libya: 'right',
  Liechtenstein: 'right',
  Lithuania: 'right',
  Luxembourg: 'right',
  Madagascar: 'right',
  Malawi: 'left',
  Malaysia: 'left',
  Maldives: 'left',
  Mali: 'right',
  Malta: 'left',
  'Marshall Islands': 'right',
  Mauritania: 'right',
  Mauritius: 'left',
  Mexico: 'right',
  Micronesia: 'right',
  Moldova: 'right',
  Monaco: 'right',
  Mongolia: 'right',
  Montenegro: 'right',
  Morocco: 'right',
  Mozambique: 'left',
  Myanmar: 'right',
  Namibia: 'left',
  Nauru: 'left',
  Nepal: 'left',
  Netherlands: 'right',
  'New Zealand': 'left',
  Nicaragua: 'right',
  Niger: 'right',
  Nigeria: 'right',
  'North Korea': 'right',
  'North Macedonia': 'right',
  Norway: 'right',
  Oman: 'right',
  Pakistan: 'left',
  Palau: 'right',
  Palestine: 'right',
  Panama: 'right',
  'Papua New Guinea': 'left',
  Paraguay: 'right',
  Peru: 'right',
  Philippines: 'right',
  Poland: 'right',
  Portugal: 'right',
  Qatar: 'right',
  Romania: 'right',
  Russia: 'right',
  Rwanda: 'right',
  'Saint Kitts and Nevis': 'left',
  'Saint Lucia': 'left',
  Samoa: 'left',
  'San Marino': 'right',
  'São Tomé and Príncipe': 'right',
  'Saudi Arabia': 'right',
  Senegal: 'right',
  Serbia: 'right',
  Seychelles: 'left',
  'Sierra Leone': 'right',
  Singapore: 'left',
  Slovakia: 'right',
  Slovenia: 'right',
  'Solomon Islands': 'left',
  Somalia: 'right',
  'South Africa': 'left',
  'South Korea': 'right',
  'South Sudan': 'right',
  Spain: 'right',
  'Sri Lanka': 'left',
  Sudan: 'right',
  Suriname: 'left',
  Sweden: 'right',
  Switzerland: 'right',
  Syria: 'right',
  Taiwan: 'right',
  Tajikistan: 'right',
  Tanzania: 'left',
  Thailand: 'left',
  Togo: 'right',
  Tonga: 'left',
  'Trinidad and Tobago': 'left',
  Tunisia: 'right',
  Turkey: 'right',
  Turkmenistan: 'right',
  Tuvalu: 'left',
  Uganda: 'left',
  Ukraine: 'right',
  'United Arab Emirates': 'right',
  'British Indian Ocean Territory': 'right',
  'British Virgin Islands': 'left',
  'Cayman Islands': 'left',
  'Falkland Islands': 'left',
  Gibraltar: 'right',
  Guernsey: 'left',
  'Isle of Man': 'left',
  Jersey: 'left',
  'Pitcairn Islands': 'left',
  'Turks and Caicos Islands': 'left',
  Alaska: 'right',
  Hawaii: 'right',
  'Puerto Rico': 'right',
  'U.S. Virgin Islands': 'left',
  Guam: 'right',
  'Northern Mariana Islands': 'right',
  'American Samoa': 'right',
  Uruguay: 'right',
  Uzbekistan: 'right',
  Vanuatu: 'right',
  'Vatican City': 'right',
  Venezuela: 'right',
  Vietnam: 'right',
  'Western Sahara': 'right',
  Yemen: 'right',
  Zambia: 'left',
  Zimbabwe: 'left',
}

export type Country = {
  id: string
  side: Side
  imageUrl: string
  name: string
}

const correctedCountrySideData: typeof rawCountrySideData = {
  ...rawCountrySideData,
  'United States': 'right',
  'United Kingdom': 'left',
  Canada: 'right',
}

export function getCompleteCountries(): Country[] {
  const nameToCodeMapping: Record<string, string> = {}
  for (const [code, name] of Object.entries(countryCodeMapping)) {
    nameToCodeMapping[name] = code
  }

  const countries: Country[] = []
  for (const [name, side] of Object.entries(correctedCountrySideData)) {
    const code = nameToCodeMapping[name]
    if (!code) {
      console.warn('Country code not found by country name', name)
      continue
    }

    countries.push({
      id: code.toLowerCase(),
      side,
      imageUrl: `./country-flag-svg/${code.toLowerCase()}.svg`,
      name,
    })
  }

  return countries
}
