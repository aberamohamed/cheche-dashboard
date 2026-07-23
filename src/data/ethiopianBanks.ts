export const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'United Bank',
  'Nib International Bank',
  'Cooperative Bank of Oromia',
  'Oromia International Bank',
  'Lion International Bank',
  'Zemen Bank',
  'Bunna International Bank',
  'Berhan International Bank',
  'Addis International Bank',
  'Abay Bank',
  'Enat Bank',
  'Goh Betoch Bank',
  'Hibret Bank',
  'Shabelle Bank',
  'Siinqee Bank',
] as const;

export type EthiopianBank = (typeof ETHIOPIAN_BANKS)[number];
