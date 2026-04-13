export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'TR', name: 'Turkey',           dialCode: '+90',  flag: '🇹🇷' },
  { code: 'US', name: 'United States',    dialCode: '+1',   flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom',   dialCode: '+44',  flag: '🇬🇧' },
  { code: 'DE', name: 'Germany',          dialCode: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',           dialCode: '+33',  flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands',      dialCode: '+31',  flag: '🇳🇱' },
  { code: 'IT', name: 'Italy',            dialCode: '+39',  flag: '🇮🇹' },
  { code: 'ES', name: 'Spain',            dialCode: '+34',  flag: '🇪🇸' },
  { code: 'BE', name: 'Belgium',          dialCode: '+32',  flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland',      dialCode: '+41',  flag: '🇨🇭' },
  { code: 'AT', name: 'Austria',          dialCode: '+43',  flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden',           dialCode: '+46',  flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',           dialCode: '+47',  flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark',          dialCode: '+45',  flag: '🇩🇰' },
  { code: 'PL', name: 'Poland',           dialCode: '+48',  flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',         dialCode: '+351', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece',           dialCode: '+30',  flag: '🇬🇷' },
  { code: 'RO', name: 'Romania',          dialCode: '+40',  flag: '🇷🇴' },
  { code: 'UA', name: 'Ukraine',          dialCode: '+380', flag: '🇺🇦' },
  { code: 'RU', name: 'Russia',           dialCode: '+7',   flag: '🇷🇺' },
  { code: 'AZ', name: 'Azerbaijan',       dialCode: '+994', flag: '🇦🇿' },
  { code: 'GE', name: 'Georgia',          dialCode: '+995', flag: '🇬🇪' },
  { code: 'CA', name: 'Canada',           dialCode: '+1',   flag: '🇨🇦' },
  { code: 'AU', name: 'Australia',        dialCode: '+61',  flag: '🇦🇺' },
  { code: 'JP', name: 'Japan',            dialCode: '+81',  flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea',      dialCode: '+82',  flag: '🇰🇷' },
  { code: 'CN', name: 'China',            dialCode: '+86',  flag: '🇨🇳' },
  { code: 'IN', name: 'India',            dialCode: '+91',  flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan',         dialCode: '+92',  flag: '🇵🇰' },
  { code: 'SA', name: 'Saudi Arabia',     dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'EG', name: 'Egypt',            dialCode: '+20',  flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa',     dialCode: '+27',  flag: '🇿🇦' },
  { code: 'BR', name: 'Brazil',           dialCode: '+55',  flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',           dialCode: '+52',  flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina',        dialCode: '+54',  flag: '🇦🇷' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Turkey
