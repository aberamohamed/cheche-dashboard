export const CUSTOMER_TRANSACTION_TYPES = [
  { id: 'B2C', label: 'B2C (Business to Consumer)' },
  { id: 'B2B', label: 'B2B (Business to Business)' },
] as const;

export const CUSTOMER_ID_TYPES = [
  { id: 'TIN', label: 'TIN' },
  { id: 'NATIONAL_ID', label: 'National ID' },
  { id: 'PASSPORT', label: 'Passport' },
  { id: 'DRIVING_LICENSE', label: 'Driving License' },
] as const;
